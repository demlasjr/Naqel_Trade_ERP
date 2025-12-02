import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Department } from "@/types/department";

export function useDepartments() {
  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      return data.map((dept: any) => ({
        id: dept.id,
        code: dept.code,
        name: dept.name,
        managerId: dept.manager_id,
        description: dept.description,
        budget: dept.budget,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at,
      })) as Department[];
    },
  });

  return {
    departments: departmentsQuery.data ?? [],
    isLoading: departmentsQuery.isLoading,
    error: departmentsQuery.error,
  };
}
