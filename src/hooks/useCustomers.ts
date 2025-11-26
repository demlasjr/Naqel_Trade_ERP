import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const mappedCustomers: Customer[] = (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        company: c.company || undefined,
        address: c.address || "",
        city: c.city || "",
        country: c.country || "",
        taxId: c.tax_id || undefined,
        creditLimit: c.credit_limit || 0,
        balance: c.current_balance || 0,
        status: c.status as "active" | "inactive",
        createdAt: c.created_at,
      }));

      setCustomers(mappedCustomers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    customers,
    loading,
    refetch: fetchCustomers,
  };
}
