import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, PurchaseStatus } from "@/types/purchase";
import { toast } from "@/lib/toast";

export function usePurchases() {
  const queryClient = useQueryClient();

  const purchasesQuery = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          vendor:vendors(id, name),
          line_items:purchase_line_items(
            id,
            product_id,
            product:products(name),
            quantity,
            unit_price,
            total
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((po) => ({
        id: po.id,
        orderNumber: po.order_number,
        date: po.date,
        vendorId: po.vendor_id,
        vendorName: po.vendor?.name || "",
        status: po.status as PurchaseStatus,
        lineItems: po.line_items.map((li: any) => ({
          id: li.id,
          productId: li.product_id,
          productName: li.product?.name || "",
          quantity: li.quantity,
          unitPrice: li.unit_price,
          total: li.total,
        })),
        subtotal: po.subtotal,
        tax: po.tax,
        taxRate: po.tax_rate,
        total: po.total,
        amountPaid: po.amount_paid,
        balance: po.balance,
        notes: po.notes,
        receivedDate: po.received_date,
        paymentDate: po.payment_date,
        createdAt: po.created_at,
        createdBy: po.created_by,
      })) as PurchaseOrder[];
    },
  });

  const createPurchase = useMutation({
    mutationFn: async (purchaseData: Partial<PurchaseOrder>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: purchaseOrder, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          order_number: purchaseData.orderNumber,
          date: purchaseData.date,
          vendor_id: purchaseData.vendorId,
          status: purchaseData.status,
          subtotal: purchaseData.subtotal,
          tax: purchaseData.tax,
          tax_rate: purchaseData.taxRate,
          total: purchaseData.total,
          amount_paid: purchaseData.amountPaid || 0,
          balance: purchaseData.balance || purchaseData.total,
          notes: purchaseData.notes,
          received_date: purchaseData.receivedDate,
          payment_date: purchaseData.paymentDate,
          created_by: user.id,
        })
        .select()
        .single();

      if (poError) throw poError;

      if (purchaseData.lineItems && purchaseData.lineItems.length > 0) {
        const { error: lineItemsError } = await supabase
          .from("purchase_line_items")
          .insert(
            purchaseData.lineItems.map((item) => ({
              purchase_order_id: purchaseOrder.id,
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.total,
            }))
          );

        if (lineItemsError) throw lineItemsError;
      }

      return purchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase order created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create purchase order", error.message);
    },
  });

  const updatePurchase = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => {
      const { error: poError } = await supabase
        .from("purchase_orders")
        .update({
          order_number: data.orderNumber,
          date: data.date,
          vendor_id: data.vendorId,
          status: data.status,
          subtotal: data.subtotal,
          tax: data.tax,
          tax_rate: data.taxRate,
          total: data.total,
          amount_paid: data.amountPaid,
          balance: data.balance,
          notes: data.notes,
          received_date: data.receivedDate,
          payment_date: data.paymentDate,
        })
        .eq("id", id);

      if (poError) throw poError;

      if (data.lineItems) {
        await supabase.from("purchase_line_items").delete().eq("purchase_order_id", id);

        if (data.lineItems.length > 0) {
          const { error: lineItemsError } = await supabase
            .from("purchase_line_items")
            .insert(
              data.lineItems.map((item) => ({
                purchase_order_id: id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total: item.total,
              }))
            );

          if (lineItemsError) throw lineItemsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase order updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update purchase order", error.message);
    },
  });

  const deletePurchases = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("purchase_orders").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success(`${ids.length} purchase order(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete purchase orders", error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status, updateData }: { ids: string[]; status: PurchaseStatus; updateData?: Partial<PurchaseOrder> }) => {
      const updates: any = { status };
      
      if (updateData) {
        if (updateData.receivedDate) updates.received_date = updateData.receivedDate;
        if (updateData.paymentDate) updates.payment_date = updateData.paymentDate;
        if (updateData.amountPaid !== undefined) updates.amount_paid = updateData.amountPaid;
        if (updateData.balance !== undefined) updates.balance = updateData.balance;
      }

      const { error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success(`${ids.length} purchase order(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update purchase orders", error.message);
    },
  });

  return {
    purchases: purchasesQuery.data ?? [],
    isLoading: purchasesQuery.isLoading,
    error: purchasesQuery.error,
    createPurchase: createPurchase.mutateAsync,
    updatePurchase: updatePurchase.mutateAsync,
    deletePurchases: deletePurchases.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatus.mutateAsync,
  };
}
