import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package } from "lucide-react";

const lowStockItems = [
  {
    id: "PRD-001",
    name: "Premium Office Chair",
    sku: "CHAIR-001",
    currentStock: 3,
    minStock: 10,
    category: "Furniture",
  },
  {
    id: "PRD-002",
    name: "Wireless Mouse",
    sku: "MOUSE-001",
    currentStock: 5,
    minStock: 20,
    category: "Electronics",
  },
  {
    id: "PRD-003",
    name: "A4 Paper Ream",
    sku: "PAPER-001",
    currentStock: 8,
    minStock: 50,
    category: "Supplies",
  },
  {
    id: "PRD-004",
    name: "USB-C Cable",
    sku: "CABLE-001",
    currentStock: 2,
    minStock: 15,
    category: "Electronics",
  },
];

export function LowStockAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Package className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.sku} • {item.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-warning">
                    {item.currentStock} units
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.minStock}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Reorder
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
