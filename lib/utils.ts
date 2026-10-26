export function centsToUnits(cents: number): number {
  return cents / 100;
}

export function unitsToCents(units: number): number {
  return Math.round(units * 100);
}

export function formatMoney(cents: number, opts: { sign?: boolean } = {}): string {
  const units = centsToUnits(Math.abs(cents));
  const formatted = units.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!opts.sign) return formatted;
  return cents < 0 ? `-${formatted}` : cents > 0 ? formatted : formatted;
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start, end };
}

export const CATEGORY_ICONS: Record<string, string> = {
  food: "🍚",
  transport: "🚌",
  shopping: "🛍️",
  bills: "🧾",
  health: "💊",
  entertainment: "🎬",
  travel: "✈️",
  social: "🎉",
  charity: "🤝",
  education: "📚",
  home: "🏠",
  salary: "💰",
  gift: "🎁",
  investment: "📈",
  other: "•",
  dot: "•",
};

// Old categories store a keyword ("food"); new ones store the emoji itself.
export function iconFor(icon: string | null | undefined): string {
  if (!icon) return "•";
  if (CATEGORY_ICONS[icon]) return CATEGORY_ICONS[icon];
  return /^[a-z]+$/i.test(icon) ? "•" : icon;
}

export const ICON_GROUPS: { label: string; icons: string[] }[] = [
  { label: "Food and drink", icons: ["🍚", "🍜", "🍣", "🍔", "🍕", "🥗", "🍱", "🥟", "🍢", "🍰", "🍩", "🍦", "☕", "🧋", "🍺", "🍷", "🛒", "🥬", "🍎", "🥖"] },
  { label: "Getting around", icons: ["🚌", "🚇", "🚆", "🚄", "🚕", "🛵", "🚲", "🚗", "⛽", "🅿️", "✈️", "🚢", "🧳", "🏨", "🗺️", "🏖️"] },
  { label: "Home and bills", icons: ["🏠", "🛋️", "🧹", "🔧", "💡", "🚿", "🔥", "📶", "📱", "💻", "🧾", "🏦", "🛡️", "📦", "🔑", "🪴"] },
  { label: "Shopping and style", icons: ["🛍️", "👕", "👟", "👜", "💄", "💍", "🎧", "📷", "⌚", "🕶️", "🧸", "✂️", "💈", "🧴"] },
  { label: "Health and fitness", icons: ["💊", "🩺", "🦷", "👓", "🏃", "🏋️", "🧘", "⚽", "🏀", "🎾", "🏊", "🚴"] },
  { label: "Fun and social", icons: ["🎬", "🎮", "🎵", "🎤", "🎟️", "🎨", "📚", "🎉", "🎂", "🍻", "🎁", "🤝", "💐", "🎲", "🎳", "🏕️"] },
  { label: "Family and pets", icons: ["👶", "👨‍👩‍👧", "🐾", "🐶", "🐱", "🎓", "✏️", "🏫"] },
  { label: "Money", icons: ["💰", "💵", "💳", "📈", "🪙", "🏧", "🧧", "🎰", "💼", "🧮", "📊", "❤️"] },
];
