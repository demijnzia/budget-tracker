// Reads the carrier-invoice file exported from the Taiwan e-invoice platform
// (財政部電子發票整合服務平台). It accepts pipe-delimited files with M/D rows
// as well as ordinary comma-separated files, finds columns by their header
// names, and understands both Gregorian and ROC (民國) dates.

export type ParsedInvoice = {
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  store: string;
  amount: number; // whole currency units, e.g. 120.5
};

export type ParseResult = {
  rows: ParsedInvoice[];
  voided: number; // invoices marked as cancelled (作廢), left out
  unreadable: number; // lines that had the right shape but no valid date or amount
  headerFound: boolean;
};

const HEADERS = {
  date: ["發票日期", "消費日期", "開立日期", "日期", "date"],
  amount: ["總金額", "消費金額", "發票金額", "金額", "合計", "amount", "total"],
  store: ["商店店名", "店家名稱", "商店名稱", "賣方名稱", "賣方店名", "店名", "商家", "store", "merchant", "seller"],
  invoice: ["發票號碼", "發票編號", "invoice"],
  status: ["發票狀態", "狀態", "status"],
} as const;

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

export function parseInvoiceFile(text: string): ParseResult {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  const result: ParseResult = { rows: [], voided: 0, unreadable: 0, headerFound: false };
  if (lines.length === 0) return result;

  const pipes = lines.filter((l) => l.includes("|")).length;
  const delimiter = pipes > lines.length / 2 ? "|" : ",";

  let cols: { date: number; amount: number; store: number; invoice: number; status: number } | null = null;
  const seen = new Set<string>();

  for (const line of lines) {
    const cells = splitLine(line, delimiter);

    const date = findColumn(cells, HEADERS.date);
    const amount = findColumn(cells, HEADERS.amount);
    if (date >= 0 && amount >= 0) {
      cols = {
        date,
        amount,
        store: findColumn(cells, HEADERS.store),
        invoice: findColumn(cells, HEADERS.invoice),
        status: findColumn(cells, HEADERS.status),
      };
      result.headerFound = true;
      continue;
    }
    if (!cols) continue;
    if (cells[0] === "D") continue; // line-item rows

    const d = parseDate(cells[cols.date] ?? "");
    const a = parseAmount(cells[cols.amount] ?? "");
    if (!d || a === null) {
      if (cells.length >= 4) result.unreadable++;
      continue;
    }
    const status = cols.status >= 0 ? cells[cols.status] ?? "" : "";
    if (/作廢|void/i.test(status)) {
      result.voided++;
      continue;
    }
    const invoiceNo = (cols.invoice >= 0 ? cells[cols.invoice] ?? "" : "").toUpperCase();
    if (invoiceNo) {
      if (seen.has(invoiceNo)) continue;
      seen.add(invoiceNo);
    }
    result.rows.push({
      invoiceNo,
      date: d,
      store: (cols.store >= 0 ? cells[cols.store] ?? "" : "") || "Invoice",
      amount: a,
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
