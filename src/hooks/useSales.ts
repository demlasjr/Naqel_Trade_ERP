import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SalesOrder, LineItem } from "@/types/sale";
import { toast } from "sonner";

export function useSales() {
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      // Fetch sales orders separately, then line items
      const { data: salesData, error: salesError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customer:customers(id, name)
        `)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Fetch line items for all sales
      const salesIds = (salesData || []).map(s => s.id);
      let lineItemsMap: Record<string, any[]> = {};
      
      if (salesIds.length > 0) {
        const { data: lineItems, error: lineItemsError } = await supabase
          .from("sales_line_items")
          .select("*")
          .in("sale_id", salesIds);
        
        if (!lineItemsError && lineItems) {
          lineItems.forEach(item => {
            if (!lineItemsMap[item.sale_id]) {
              lineItemsMap[item.sale_id] = [];
            }
            lineItemsMap[item.sale_id].push(item);
          });
        }
      }

      const mappedSales: SalesOrder[] = (salesData || []).map((sale) => ({
        id: sale.id,
        orderNumber: sale.order_number,
        customerId: sale.customer_id,
        customerName: sale.customer?.name || "",
        date: sale.order_date,
        dueDate: sale.order_date,
        status: sale.status,
        lineItems: (lineItemsMap[sale.id] || []).map((item: any): LineItem => ({
          id: item.id,
          productId: item.product_id,
          productName: "",
          sku: "",
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount || 0,
          tax: item.tax || 0,
          total: item.total,
        })),
        subtotal: sale.subtotal,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        total: sale.total,
        paidAmount: sale.paid_amount || 0,
        balance: sale.balance,
        notes: sale.notes || undefined,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
      }));

      setSales(mappedSales);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  };

  const createSalesOrder = async (orderData: Partial<SalesOrder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert sales order
      const { data: salesOrder, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          customer_id: orderData.customerId,
          order_date: orderData.date,
          status: orderData.status || "draft",
          subtotal: orderData.subtotal,
          discount_amount: orderData.discountAmount,
          tax_amount: orderData.taxAmount,
          total: orderData.total,
          paid_amount: orderData.paidAmount || 0,
          balance: orderData.balance,
          notes: orderData.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert line items
      if (orderData.lineItems && orderData.lineItems.length > 0) {
        const lineItemsData = orderData.lineItems.map((item) => ({
          sale_id: salesOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          total: item.total,
        }));

        const { error: lineItemsError } = await supabase
          .from("sales_line_items")
          .insert(lineItemsData);

        if (lineItemsError) throw lineItemsError;
      }

      toast.success("Sales order created successfully");
      await fetchSales();
      return salesOrder;
    } catch (error: any) {
      console.error("Error creating sales order:", error);
      toast.error(error.message || "Failed to create sales order");
      throw error;
    }
  };

  const updateSalesOrder = async (id: string, orderData: Partial<SalesOrder>) => {
    try {
      // Update sales order
      const { error: orderError } = await supabase
        .from("sales_orders")
        .update({
          customer_id: orderData.customerId,
          order_date: orderData.date,
          status: orderData.status,
          subtotal: orderData.subtotal,
          discount_amount: orderData.discountAmount,
          tax_amount: orderData.taxAmount,
          total: orderData.total,
          paid_amount: orderData.paidAmount,
          balance: orderData.balance,
          notes: orderData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (orderError) throw orderError;

      // Delete existing line items and insert new ones
      if (orderData.lineItems) {
        const { error: deleteError } = await supabase
          .from("sales_line_items")
          .delete()
          .eq("sale_id", id);

        if (deleteError) throw deleteError;

        if (orderData.lineItems.length > 0) {
          const lineItemsData = orderData.lineItems.map((item) => ({
            sale_id: id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            total: item.total,
          }));

          const { error: lineItemsError } = await supabase
            .from("sales_line_items")
            .insert(lineItemsData);

          if (lineItemsError) throw lineItemsError;
        }
      }

      toast.success("Sales order updated successfully");
      await fetchSales();
    } catch (error: any) {
      console.error("Error updating sales order:", error);
      toast.error(error.message || "Failed to update sales order");
      throw error;
    }
  };

  const deleteSalesOrders = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .delete()
        .in("id", ids);

      if (error) throw error;

      toast.success(`${ids.length} sales order(s) deleted successfully`);
      await fetchSales();
    } catch (error: any) {
      console.error("Error deleting sales orders:", error);
      toast.error(error.message || "Failed to delete sales orders");
      throw error;
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: string) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids);

      if (error) throw error;

      toast.success(`${ids.length} sales order(s) updated successfully`);
      await fetchSales();
    } catch (error: any) {
      console.error("Error updating sales order status:", error);
      toast.error(error.message || "Failed to update sales order status");
      throw error;
    }
  };

  return {
    sales,
    loading,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrders,
    bulkUpdateStatus,
    refetch: fetchSales,
  };
}
