export type TransactionStatus = "pending" | "completed" | "cancelled";

export type TransactionType = 
  | "sale" 
  | "purchase" 
  | "payment" 
  | "receipt" 
  | "expense" 
  | "refund" 
  | "adjustment"
  | "transfer";

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  accountFrom?: string;
  accountTo?: string;
  amount: number;
  status: TransactionStatus;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionFilters {
  search: string;
  status: TransactionStatus | "all";
  type: TransactionType | "all";
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}
