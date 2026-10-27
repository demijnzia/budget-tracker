import { PrismaClient, TxType } from "@prisma/client";

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "food", color: "#B3452F" },
  { name: "Transport", icon: "transport", color: "#C9962C" },
  { name: "Shopping", icon: "shopping", color: "#8A5A9E" },
  { name: "Bills", icon: "bills", color: "#3B6B4A" },
  { name: "Health", icon: "health", color: "#3C7A89" },
  { name: "Entertainment", icon: "entertainment", color: "#C24E6B" },
  { name: "Travel", icon: "travel", color: "#4E7FC2" },
  { name: "Social", icon: "social", color: "#D97B4F" },
  { name: "Home", icon: "home", color: "#6B7A3B" },
  { name: "Other", icon: "other", color: "#7A7268" },
];

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "salary", color: "#3B6B4A" },
  { name: "Gift", icon: "gift", color: "#C9962C" },
  { name: "Investment", icon: "investment", color: "#4E7FC2" },
  { name: "Other Income", icon: "other", color: "#7A7268" },
];

// Built-in categories are shared by every user (userId stays null).
async function addBuiltIn(c: { name: string; icon: string; color: string }, type: TxType) {
  const exists = await prisma.category.findFirst({ where: { name: c.name, userId: null } });
  if (!exists) await prisma.category.create({ data: { ...c, type, userId: null } });
}

async function main() {
  for (const c of EXPENSE_CATEGORIES) await addBuiltIn(c, TxType.EXPENSE);
  for (const c of INCOME_CATEGORIES) await addBuiltIn(c, TxType.INCOME);
  console.log("Seeded categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
