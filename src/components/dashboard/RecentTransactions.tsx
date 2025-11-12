import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const transactions = [
  {
    id: "TRX-001",
    type: "sale",
    customer: "Acme Corp",
    amount: 12500,
    status: "completed",
    date: "2024-11-08",
  },
  {
    id: "TRX-002",
    type: "purchase",
    vendor: "Office Supplies Co",
    amount: -3200,
    status: "completed",
    date: "2024-11-08",
  },
  {
    id: "TRX-003",
    type: "sale",
    customer: "Tech Solutions Ltd",
    amount: 8900,
    status: "pending",
    date: "2024-11-07",
  },
  {
    id: "TRX-004",
    type: "purchase",
    vendor: "Equipment Rentals Inc",
    amount: -5600,
    status: "completed",
    date: "2024-11-07",
  },
  {
    id: "TRX-005",
    type: "sale",
    customer: "Global Industries",
    amount: 15800,
    status: "completed",
    date: "2024-11-06",
  },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    transaction.type === "sale"
                      ? "bg-success/10"
                      : "bg-destructive/10"
                  }`}
                >
                  {transaction.type === "sale" ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {transaction.customer || transaction.vendor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.id} • {transaction.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`text-sm font-semibold ${
                    transaction.amount > 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {Math.abs(transaction.amount).toLocaleString()} MRU
                </p>
                <Badge
                  variant={
                    transaction.status === "completed" ? "default" : "secondary"
                  }
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
