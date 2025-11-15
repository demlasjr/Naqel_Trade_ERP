import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PurchaseFilters } from "@/components/purchases/PurchaseFilters";
import { PurchaseDetailDialog } from "@/components/purchases/PurchaseDetailDialog";
import { PurchaseFormDialog } from "@/components/purchases/PurchaseFormDialog";
import { PurchaseBulkActionsBar } from "@/components/purchases/PurchaseBulkActionsBar";
import { PurchaseAnalytics } from "@/components/purchases/PurchaseAnalytics";
import { mockPurchases } from "@/data/mockPurchases";
import { mockVendors } from "@/data/mockVendors";
import { mockProducts } from "@/data/mockProducts";
import { PurchaseOrder, PurchaseFilters as PurchaseFiltersType } from "@/types/purchase";
import { format } from "date-fns";
import { toast } from "sonner";

const statusStyles = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  received: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export default function Purchases() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(mockPurchases);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PurchaseFiltersType>({
    search: "",
    status: "all",
    vendorId: "all",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });

  const filteredPurchases = purchases.filter((purchase) => {
    if (filters.search && !purchase.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !purchase.notes?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== "all" && purchase.status !== filters.status) return false;
    if (filters.vendorId !== "all" && purchase.vendorId !== filters.vendorId) return false;
    if (filters.dateFrom && new Date(purchase.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(purchase.date) > new Date(filters.dateTo)) return false;
    if (filters.amountMin && purchase.total < Number(filters.amountMin)) return false;
    if (filters.amountMax && purchase.total > Number(filters.amountMax)) return false;
    return true;
  });

  const handleView = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const handleEdit = (purchase: PurchaseOrder) => {
    setSelectedPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPurchase(null);
    setIsFormOpen(true);
  };

  const handleSave = (purchaseData: Partial<PurchaseOrder>) => {
    if (selectedPurchase) {
      setPurchases(purchases.map((p) => (p.id === selectedPurchase.id ? { ...p, ...purchaseData } : p)));
      toast.success("Purchase order updated successfully");
    } else {
      const newPurchase: PurchaseOrder = {
        id: `po-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: "admin",
        amountPaid: 0,
        balance: purchaseData.total || 0,
        ...purchaseData,
      } as PurchaseOrder;
      setPurchases([newPurchase, ...purchases]);
      toast.success("Purchase order created successfully");
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPurchases.map((p) => p.id)));
    }
  };

  const handleBulkMarkOrdered = () => {
    setPurchases(purchases.map((p) => (selectedIds.has(p.id) ? { ...p, status: "ordered" as const } : p)));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} purchase order(s) marked as ordered`);
  };

  const handleBulkMarkReceived = () => {
    setPurchases(purchases.map((p) => (selectedIds.has(p.id) ? { ...p, status: "received" as const } : p)));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} purchase order(s) marked as received`);
  };

  const handleBulkMarkPaid = () => {
    setPurchases(purchases.map((p) => (selectedIds.has(p.id) ? { ...p, status: "paid" as const, amountPaid: p.total, balance: 0 } : p)));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} purchase order(s) marked as paid`);
  };

  const handleBulkCancel = () => {
    setPurchases(purchases.map((p) => (selectedIds.has(p.id) ? { ...p, status: "cancelled" as const } : p)));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} purchase order(s) cancelled`);
  };

  const handleBulkDelete = () => {
    setPurchases(purchases.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} purchase order(s) deleted`);
  };

  const handleBulkExport = () => {
    const selectedPurchases = purchases.filter((p) => selectedIds.has(p.id));
    const csv = [
      ["Order Number", "Date", "Vendor", "Status", "Subtotal", "Tax", "Total", "Paid", "Balance"],
      ...selectedPurchases.map((p) => [
        p.orderNumber,
        format(new Date(p.date), "yyyy-MM-dd"),
        p.vendorName,
        p.status,
        p.subtotal,
        p.tax,
        p.total,
        p.amountPaid,
        p.balance,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchases-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Purchase orders exported successfully");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-muted-foreground mt-1">Manage purchase orders and vendor relationships</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <PurchaseAnalytics purchases={purchases} />

      <PurchaseFilters filters={filters} onFiltersChange={setFilters} vendors={mockVendors} />

      <div className="bg-card rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredPurchases.length && filteredPurchases.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium">Order #</th>
                <th className="p-4 text-left text-sm font-medium">Date</th>
                <th className="p-4 text-left text-sm font-medium">Vendor</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-right text-sm font-medium">Total</th>
                <th className="p-4 text-right text-sm font-medium">Paid</th>
                <th className="p-4 text-right text-sm font-medium">Balance</th>
                <th className="p-4 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.has(purchase.id)}
                      onCheckedChange={() => handleToggleSelect(purchase.id)}
                    />
                  </td>
                  <td className="p-4 font-medium">{purchase.orderNumber}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(purchase.date), "MMM dd, yyyy")}
                  </td>
                  <td className="p-4">{purchase.vendorName}</td>
                  <td className="p-4">
                    <Badge className={statusStyles[purchase.status]}>{purchase.status.toUpperCase()}</Badge>
                  </td>
                  <td className="p-4 text-right font-semibold">MRU {purchase.total.toLocaleString()}</td>
                  <td className="p-4 text-right text-green-600">MRU {purchase.amountPaid.toLocaleString()}</td>
                  <td className="p-4 text-right text-orange-600">MRU {purchase.balance.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(purchase)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPurchases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No purchase orders found</p>
          </div>
        )}
      </div>

      <PurchaseDetailDialog purchase={selectedPurchase} open={isDetailOpen} onOpenChange={setIsDetailOpen} />

      <PurchaseFormDialog
        purchase={selectedPurchase}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        vendors={mockVendors}
        products={mockProducts}
      />

      <PurchaseBulkActionsBar
        selectedCount={selectedIds.size}
        onMarkOrdered={handleBulkMarkOrdered}
        onMarkReceived={handleBulkMarkReceived}
        onMarkPaid={handleBulkMarkPaid}
        onCancel={handleBulkCancel}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
