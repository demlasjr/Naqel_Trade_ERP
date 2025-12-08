import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { toast } from "sonner";

export function useCustomers() {
  const queryClient = useQueryClient();
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
        address: c.address || "",
        city: c.city || "",
        country: c.country || "",
        taxId: c.tax_id || undefined,
        creditLimit: c.credit_limit || 0,
        balance: c.balance || 0,
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

  const generateCustomerCode = () => {
    const prefix = "CUST";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  };

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("customers")
        .insert({
          code: generateCustomerCode(),
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone || null,
          address: customerData.address || null,
          city: customerData.city || null,
          country: customerData.country || null,
          tax_id: customerData.taxId || null,
          credit_limit: customerData.creditLimit || 0,
          balance: customerData.balance || 0,
          status: customerData.status || "active",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      fetchCustomers();
      toast.success("Customer created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create customer: " + error.message);
    },
  });

  return {
    customers,
    loading,
    refetch: fetchCustomers,
    createCustomer: createCustomerMutation.mutateAsync,
  };
}
