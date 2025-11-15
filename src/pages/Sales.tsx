import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, FileText, Download } from "lucide-react";
import { SalesFilters } from "@/components/sales/SalesFilters";
import { SalesDetailDialog } from "@/components/sales/SalesDetailDialog";
import { SalesFormDialog } from "@/components/sales/SalesFormDialog";
import { SalesBulkActionsBar } from "@/components/sales/SalesBulkActionsBar";
import { SalesAnalytics } from "@/components/sales/SalesAnalytics";
import { mockSales } from "@/data/mockSales";
import { mockCustomers } from "@/data/mockCustomers";
import { mockProducts } from "@/data/mockProducts";
import { SalesOrder, SalesFilters as SalesFiltersType } from "@/types/sale";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors = {
  draft: "bg-gray-500",
  confirmed: "bg-blue-500",
  invoiced: "bg-purple-500",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
};

export default function Sales() {
  const { toast } = useToast();
  const [sales, setSales] = useState<SalesOrder[]>(mockSales);
  const [selectedSale, setSelectedSale] = useState<SalesOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SalesFiltersType>({
    search: "",
    status: "all",
    customerId: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
  });

  const filteredSales = sales.filter((sale) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !sale.orderNumber.toLowerCase().includes(searchLower) &&
        !sale.customerName.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (filters.status !== "all" && sale.status !== filters.status) return false;
    if (filters.customerId !== "all" && sale.customerId !== filters.customerId) return false;
    if (filters.dateFrom && sale.date < filters.dateFrom) return false;
    if (filters.dateTo && sale.date > filters.dateTo) return false;
    if (filters.minAmount && sale.total < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && sale.total > parseFloat(filters.maxAmount)) return false;
    return true;
  });

  const handleViewDetails = (sale: SalesOrder) => {
    setSelectedSale(sale);
    setShowDetailDialog(true);
  };

  const handleEdit = (sale: SalesOrder) => {
    setSelectedSale(sale);
    setShowFormDialog(true);
  };

  const handleCreate = () => {
    setSelectedSale(null);
    setShowFormDialog(true);
  };

  const handleSave = (saleData: Partial<SalesOrder>) => {
    if (selectedSale) {
      setSales(sales.map((s) => (s.id === selectedSale.id ? { ...s, ...saleData, updatedAt: new Date().toISOString() } : s)));
      toast({ title: "Success", description: "Sales order updated successfully" });
    } else {
      const newSale: SalesOrder = {
        id: Date.now().toString(),
        orderNumber: `SO-2024-${String(sales.length + 1).padStart(3, "0")}`,
        ...saleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SalesOrder;
      setSales([newSale, ...sales]);
      toast({ title: "Success", description: "Sales order created successfully" });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSales.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkConfirm = () => {
    setSales(sales.map((s) => (selectedIds.has(s.id) && s.status === "draft" ? { ...s, status: "confirmed" as const } : s)));
    toast({ title: "Success", description: `${selectedIds.size} order(s) confirmed` });
    setSelectedIds(new Set());
  };

  const handleBulkCancel = () => {
    setSales(sales.map((s) => (selectedIds.has(s.id) ? { ...s, status: "cancelled" as const } : s)));
    toast({ title: "Success", description: `${selectedIds.size} order(s) cancelled` });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setSales(sales.filter((s) => !selectedIds.has(s.id)));
    toast({ title: "Success", description: `${selectedIds.size} order(s) deleted` });
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedSales = sales.filter((s) => selectedIds.has(s.id));
    const csv = [
      ["Order Number", "Customer", "Date", "Status", "Total", "Paid", "Balance"].join(","),
      ...selectedSales.map((s) =>
        [s.orderNumber, s.customerName, s.date, s.status, s.total, s.paidAmount, s.balance].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-orders.csv";
    a.click();
    toast({ title: "Success", description: "Sales orders exported successfully" });
  };

  const handleExportAll = () => {
    const csv = [
      ["Order Number", "Customer", "Date", "Status", "Total", "Paid", "Balance"].join(","),
      ...filteredSales.map((s) =>
        [s.orderNumber, s.customerName, s.date, s.status, s.total, s.paidAmount, s.balance].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-sales-orders.csv";
    a.click();
    toast({ title: "Success", description: "All sales orders exported successfully" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground mt-1">Manage sales orders, customers, and invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <SalesAnalytics sales={filteredSales} />

      <SalesFilters filters={filters} onFilterChange={setFilters} customers={mockCustomers} />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredSales.length && filteredSales.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-medium">Order #</th>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Due Date</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-right font-medium">Total</th>
                <th className="p-4 text-right font-medium">Paid</th>
                <th className="p-4 text-right font-medium">Balance</th>
                <th className="p-4 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.has(sale.id)}
                      onCheckedChange={(checked) => handleSelectOne(sale.id, checked as boolean)}
                    />
                  </td>
                  <td className="p-4 font-medium">{sale.orderNumber}</td>
                  <td className="p-4">{sale.customerName}</td>
                  <td className="p-4">{format(new Date(sale.date), "PP")}</td>
                  <td className="p-4">{format(new Date(sale.dueDate), "PP")}</td>
                  <td className="p-4">
                    <Badge className={statusColors[sale.status]}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-medium">MRU {sale.total.toFixed(2)}</td>
                  <td className="p-4 text-right text-green-600">MRU {sale.paidAmount.toFixed(2)}</td>
                  <td className="p-4 text-right text-orange-600">MRU {sale.balance.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SalesDetailDialog sale={selectedSale} open={showDetailDialog} onOpenChange={setShowDetailDialog} />
      <SalesFormDialog
        sale={selectedSale}
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        onSave={handleSave}
        customers={mockCustomers}
        products={mockProducts}
      />
      <SalesBulkActionsBar
        selectedCount={selectedIds.size}
        onConfirm={handleBulkConfirm}
        onCancel={handleBulkCancel}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
