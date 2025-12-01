import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionType } from "@/types/transaction";
import { toast } from "@/lib/toast";

export function useTransactions() {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          account_from_data:accounts!transactions_account_from_fkey(id, name, code),
          account_to_data:accounts!transactions_account_to_fkey(id, name, code)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((t: any) => ({
        id: t.id,
        date: t.date,
        type: t.type as TransactionType,
        accountFrom: t.account_from_data?.name || "",
        accountTo: t.account_to_data?.name || "",
        description: t.description,
        amount: t.amount,
        reference: t.reference,
        status: t.status,
        notes: t.notes,
        createdAt: t.created_at,
        createdBy: t.created_by,
        updatedAt: t.updated_at,
      })) as Transaction[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: Partial<Transaction>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // For now, we'll need to resolve account names to IDs
      // This is a simplified version - you may want to pass account IDs instead
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          date: transactionData.date,
          type: transactionData.type,
          description: transactionData.description,
          amount: transactionData.amount,
          reference: transactionData.reference,
          notes: transactionData.notes,
          status: transactionData.status || "pending",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create transaction", error.message);
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          date: data.date,
          type: data.type,
          description: data.description,
          amount: data.amount,
          reference: data.reference,
          notes: data.notes,
          status: data.status,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update transaction", error.message);
    },
  });

  const deleteTransactions = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("transactions").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${ids.length} transaction(s) deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete transactions", error.message);
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "pending" | "posted" | "reconciled" | "void" }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${ids.length} transaction(s) updated successfully`);
    },
    onError: (error: Error) => {
      toast.error("Failed to update transactions", error.message);
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction: createTransaction.mutateAsync,
    updateTransaction: updateTransaction.mutateAsync,
    deleteTransactions: deleteTransactions.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatus.mutateAsync,
  };
}
