import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account } from "@/types/account";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("code");

      if (error) throw error;
      
      return data.map((acc) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId: acc.parent_id,
        balance: acc.balance,
        description: acc.description,
        status: acc.status,
        createdAt: new Date(acc.created_at),
        updatedAt: new Date(acc.updated_at),
      })) as Account[];
    },
  });
}
