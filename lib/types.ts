export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "EXPENSE" | "INCOME";
};

export type Transaction = {
  id: string;
  amount: number; // cents
  type: "EXPENSE" | "INCOME";
  note: string | null;
  date: string; // ISO
  categoryId: string;
  category: Category;
};
