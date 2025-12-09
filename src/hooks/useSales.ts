import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesOrder, LineItem } from "@/types/sale";
import { toast } from "sonner";
import { useActivityLogs } from "./useActivityLog";

export function useSales() {
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { createActivityLog } = useActivityLogs();

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
      if (!user) throw new Error("User not authenticated");

      // Insert sales order
      const { data: salesOrder, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          order_number: orderData.orderNumber,
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
          created_by: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert line items and update inventory
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

        // Update inventory - decrease stock for each product
        for (const item of orderData.lineItems) {
          // Get current stock
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("current_stock")
            .eq("id", item.productId)
            .single();

          if (productError) {
            console.error(`Error fetching product ${item.productId}:`, productError);
            continue;
          }

          const newStock = Math.max(0, (product.current_stock || 0) - item.quantity);

          // Update product stock
          const { error: updateError } = await supabase
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", item.productId);

          if (updateError) {
            console.error(`Error updating stock for product ${item.productId}:`, updateError);
          }

          // Record stock movement
          await supabase.from("stock_movements").insert({
            product_id: item.productId,
            movement_type: "out",
            quantity: item.quantity,
            reference_type: "sale",
            reference_id: salesOrder.id,
            notes: `Sale order ${orderData.orderNumber}`,
            created_by: user.id,
          });
        }
      }

      // Create transaction
      if (orderData.total && orderData.total > 0) {
        // Find or create cash account (vault)
        let cashAccountId: string | null = null;
        const { data: cashAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("account_type", "asset")
          .ilike("name", "%cash%")
          .limit(1);

        if (cashAccounts && cashAccounts.length > 0) {
          cashAccountId = cashAccounts[0].id;
        } else {
          // Try to find by code
          const { data: accountByCode } = await supabase
            .from("accounts")
            .select("id")
            .eq("code", "1110")
            .single();

          if (accountByCode) {
            cashAccountId = accountByCode.id;
          }
        }

        if (cashAccountId) {
          // Create transaction
          const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
              date: orderData.date || new Date().toISOString().split("T")[0],
              type: "sale",
              description: `Sale order ${orderData.orderNumber}`,
              account_to: cashAccountId,
              amount: orderData.total,
              status: "completed",
              reference: orderData.orderNumber,
              notes: `Sale to ${orderData.customerName || "customer"}`,
              created_by: user.id,
            });

          if (transactionError) {
            console.error("Error creating transaction:", transactionError);
          } else {
            // Update cash account balance
            const { data: account } = await supabase
              .from("accounts")
              .select("balance")
              .eq("id", cashAccountId)
              .single();

            if (account) {
              await supabase
                .from("accounts")
                .update({ balance: (account.balance || 0) + orderData.total })
                .eq("id", cashAccountId);
            }
          }
        }
      }

      // Create activity log
      try {
        await createActivityLog({
          module: "sales",
          actionType: "create",
          description: `Created sales order ${orderData.orderNumber} for ${orderData.total?.toFixed(2)} MRU`,
          entityType: "sales_order",
          entityId: salesOrder.id,
          metadata: {
            orderNumber: orderData.orderNumber,
            total: orderData.total,
            customerName: orderData.customerName,
          },
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

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
