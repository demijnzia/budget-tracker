// Reads the carrier-invoice file exported from the Taiwan e-invoice platform
// (財政部電子發票整合服務平台). It accepts pipe-delimited files with M/D rows
// as well as ordinary comma-separated files, finds columns by their header
// names, and understands both Gregorian and ROC (民國) dates.

export type ParsedInvoice = {
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  store: string;
  amount: number; // invoice total in whole currency units, e.g. 120.5
  items: string; // item lines (消費明細), e.g. "御飯糰 ×2, 紅茶"
  note: string; // store name plus items, ready to save
};

export type ParseResult = {
  rows: ParsedInvoice[];
  voided: number; // invoices marked as cancelled (作廢), left out
  unreadable: number; // lines that had the right shape but no valid date or amount
  headerFound: boolean;
};

const HEADERS = {
  date: ["發票日期", "消費日期", "開立日期", "日期", "date"],
  // The invoice total. Used first when the file has one.
  total: ["總金額", "發票金額", "消費金額", "合計", "total"],
  // A bare "amount" column. It can be the invoice total or a single item, so it is checked against the other lines.
  weak: ["金額", "amount"],
  store: ["商店店名", "店家名稱", "商店名稱", "賣方名稱", "賣方店名", "店名", "商家", "store", "merchant", "seller"],
  invoice: ["發票號碼", "發票編號", "invoice"],
  status: ["發票狀態", "狀態", "status"],
} as const;

const ITEM = {
  name: /^消費明細.*(品名|品項|名稱)|^(品名|品項名稱|品項|item)$/i,
  qty: /^消費明細.*數量|^(數量|qty|quantity)$/i,
  price: /^消費明細.*單價|^(單價|unit.?price)$/i,
  amount: /^消費明細.*(金額|小計)|^小計$/,
};

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === "|") return line.split("|").map((c) => c.trim());
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function findColumn(cells: string[], names: readonly string[]): number {
  const lower = cells.map((c) => c.toLowerCase());
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function findLike(cells: string[], re: RegExp): number {
  return cells.findIndex((c) => re.test(c.trim()));
}

export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})(?!\d)/);
  if (m && (m[0].length >= 8 || /[-/.]/.test(s))) return build(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{2,3})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/); // ROC with separators
  if (m) return build(+m[1] + 1911, +m[2], +m[3]);
  m = s.match(/^(\d{3})(\d{2})(\d{2})$/); // ROC like 1141025
  if (m) return build(+m[1] + 1911, +m[2], +m[3]);
  return null;
}

function build(y: number, mo: number, d: number): string | null {
  if (y < 1990 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[,$\s]|NT|元/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Cols = {
  date: number;
  total: number;
  weak: number;
  store: number;
  invoice: number;
  status: number;
  iName: number;
  iQty: number;
  iPrice: number;
  iAmt: number;
};

type Group = {
  invoiceNo: string;
  date: string;
  store: string;
  voided: boolean;
  totals: number[]; // values of a total column, one per line
  weaks: number[]; // values of a bare amount column, one per line
  rowSums: number[]; // 消費明細 amount on each line of the invoice (or quantity x unit price)
  itemSums: number[]; // subtotals from separate D lines
  items: string[];
};

export function parseInvoiceFile(text: string): ParseResult {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const result: ParseResult = { rows: [], voided: 0, unreadable: 0, headerFound: false };
  if (lines.length === 0) return result;

  const pipes = lines.filter((l) => l.includes("|")).length;
  const delimiter = pipes > lines.length / 2 ? "|" : ",";

  let cols: Cols | null = null;
  let dCols: { invoice: number; name: number; amt: number } | null = null;
  const groups = new Map<string, Group>();
  let last: Group | null = null;
  let anon = 0;

  // Some exports have no header line. Recognise the standard column order:
  // 載具名稱, 發票日期, 發票號碼, 金額, 狀態, 是否中獎, 統編, 店名, 地址, (blank), 數量, 單價, 金額, 品名.
  const first = splitLine(lines[0], delimiter);
  if (first.length >= 13 && parseDate(first[1] ?? "") && /^[A-Za-z]{2}\d{8}$/.test(first[2] ?? "")) {
    cols = { date: 1, total: 3, weak: -1, store: 7, invoice: 2, status: 4, iName: 13, iQty: 10, iPrice: 11, iAmt: 12 };
    result.headerFound = true;
  }

  for (const line of lines) {
    const cells = splitLine(line, delimiter);

    // Header of the line-item rows in the M/D layout: D|發票號碼|小計|品項名稱
    if (cells[0] === "D" && findLike(cells, ITEM.name) >= 0 && findColumn(cells, HEADERS.date) < 0) {
      dCols = {
        invoice: findColumn(cells, HEADERS.invoice),
        name: findLike(cells, ITEM.name),
        amt: findLike(cells, ITEM.amount),
      };
      continue;
    }

    const date = findColumn(cells, HEADERS.date);
    const c: Cols = {
      date,
      total: findColumn(cells, HEADERS.total),
      weak: findColumn(cells, HEADERS.weak),
      store: findColumn(cells, HEADERS.store),
      invoice: findColumn(cells, HEADERS.invoice),
      status: findColumn(cells, HEADERS.status),
      iName: findLike(cells, ITEM.name),
      iQty: findLike(cells, ITEM.qty),
      iPrice: findLike(cells, ITEM.price),
      iAmt: findLike(cells, ITEM.amount),
    };
    if (date >= 0 && (c.total >= 0 || c.weak >= 0 || c.iAmt >= 0 || c.iPrice >= 0)) {
      cols = c;
      result.headerFound = true;
      continue;
    }
    if (!cols) continue;

    if (cells[0] === "D") {
      // line item that belongs to the invoice above
      if (dCols) {
        const key = dCols.invoice >= 0 ? (cells[dCols.invoice] ?? "").toUpperCase() : "";
        const g = (key && groups.get(key)) || last;
        const name = cells[dCols.name] ?? "";
        if (g && name) g.items.push(name);
        const amt = dCols.amt >= 0 ? parseAmount(cells[dCols.amt] ?? "") : null;
        if (g && amt !== null) g.itemSums.push(amt);
      }
      continue;
    }

    const d = parseDate(cells[cols.date] ?? "");
    const totalV = cols.total >= 0 ? parseAmount(cells[cols.total] ?? "") : null;
    const weakV = cols.weak >= 0 ? parseAmount(cells[cols.weak] ?? "") : null;
    const qty = cols.iQty >= 0 ? parseAmount(cells[cols.iQty] ?? "") : null;
    const price = cols.iPrice >= 0 ? parseAmount(cells[cols.iPrice] ?? "") : null;
    let itemAmt = cols.iAmt >= 0 ? parseAmount(cells[cols.iAmt] ?? "") : null;
    if (itemAmt === null && price !== null) itemAmt = price * (qty ?? 1);

    if (!d || (totalV === null && weakV === null && itemAmt === null)) {
      if (cells.length >= 4) result.unreadable++;
      continue;
    }

    const invoiceNo = (cols.invoice >= 0 ? cells[cols.invoice] ?? "" : "").toUpperCase();
    const key = invoiceNo || `row-${anon++}`;
    let g = groups.get(key);
    if (!g) {
      const status = cols.status >= 0 ? cells[cols.status] ?? "" : "";
      g = {
        invoiceNo,
        date: d,
        store: (cols.store >= 0 ? cells[cols.store] ?? "" : "") || "Invoice",
        voided: /作廢|void/i.test(status),
        totals: [],
        weaks: [],
        rowSums: [],
        itemSums: [],
        items: [],
      };
      groups.set(key, g);
    }
    last = g;
    if (totalV !== null) g.totals.push(totalV);
    if (weakV !== null) g.weaks.push(weakV);
    if (itemAmt !== null) g.rowSums.push(itemAmt);
    const name = cols.iName >= 0 ? cells[cols.iName] ?? "" : "";
    if (name) {
      const q = qty !== null && qty !== 1 ? ` ×${qty}` : "";
      g.items.push(name + q);
    }
  }

  for (const g of groups.values()) {
    if (g.voided) {
      result.voided++;
      continue;
    }
    // Invoice total. The 消費明細 amounts of all lines with this invoice number are added up first,
    // because a total column in these files often holds a single line's value.
    let amount: number | null = null;
    if (g.rowSums.length) amount = g.rowSums.reduce((a, b) => a + b, 0);
    else if (g.totals.length) amount = g.totals[0];
    else if (g.itemSums.length) amount = g.itemSums.reduce((a, b) => a + b, 0);
    else if (g.weaks.length) {
      // Same value on every line means it is the invoice total repeated; different values are item amounts.
      const same = g.weaks.every((w) => w === g.weaks[0]);
      amount = same ? g.weaks[0] : g.weaks.reduce((a, b) => a + b, 0);
    }
    if (amount === null || !(amount > 0)) {
      result.unreadable++;
      continue;
    }
    amount = Math.round(amount * 100) / 100;
    const items = g.items.join(", ");
    result.rows.push({
      invoiceNo: g.invoiceNo,
      date: g.date,
      store: g.store,
      amount,
      items,
      note: items ? `${g.store}: ${items}` : g.store,
    });
  }
  return result;
}

// Guess one of the app's category names from the store name.
const RULES: [string, RegExp][] = [
  ["Transport", /車隊|計程|捷運|台鐵|臺鐵|高鐵|加油|中油|台塑石油|停車|悠遊|一卡通|uber|客運|公車|交通|etag|遠通/i],
  ["Health", /藥|診所|醫院|醫療|屈臣氏|康是美|牙醫|眼科|大樹|健保/i],
  ["Bills", /電信|中華電|遠傳|台灣大哥大|台灣之星|瓦斯|自來水|台灣電力|台電|保險|管理費|寬頻|有線電視/i],
  ["Travel", /航空|旅行|旅遊|飯店|旅館|民宿|酒店|agoda|booking|klook/i],
  ["Entertainment", /威秀|影城|電影|ktv|netflix|spotify|steam|電玩|遊戲|樂園|演唱會|kkbox/i],
  ["Home", /ikea|特力屋|家具|寢具|居家|五金|hola|傢俱/i],
  ["Shopping", /蝦皮|momo|pchome|博客來|誠品|無印|uniqlo|百貨|新光三越|遠東|sogo|燦坤|全國電子|寶雅|好市多|costco|生活工場|服飾|鞋|3c|coupang|酷澎/i],
  ["Food", /7-?eleven|統一超商|全家|萊爾富|ok超商|美廉社|全聯|家樂福|麥當勞|摩斯|肯德基|漢堡|星巴克|路易莎|咖啡|餐|飲|茶|食|麵|飯|便當|早餐|小吃|滷|雞|壽司|火鍋|烘焙|麵包|蛋糕|手搖|清心|50嵐|可不可|迷客夏|大苑子|飲料|超市|市場|foodpanda|ubereats|熊貓/i],
];

export function guessCategoryName(store: string): string {
  for (const [name, re] of RULES) if (re.test(store)) return name;
  return "Other";
}

// Browser helper: UTF-8 first, then Big5 for files saved by older Excel versions.
export function decodeBytes(buf: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  if (!utf8.includes("�")) return utf8;
  try {
    return new TextDecoder("big5").decode(buf);
  } catch {
    return utf8;
  }
}
