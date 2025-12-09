import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLog, ActivityModule, ActivityActionType } from "@/types/activityLog";

export function useActivityLogs() {
  const queryClient = useQueryClient();

  const activityLogsQuery = useQuery({
    queryKey: ["activityLogs"],
    queryFn: async () => {
      // Simplified query without JOIN for faster loading
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100); // Reduced limit for much faster loading

      if (error) {
        console.error("Error fetching activity logs:", error);
        throw error;
      }

      if (!data) return [];

      return data.map((log: any) => ({
        id: log.id,
        module: log.module as ActivityModule,
        actionType: (log.action_type || log.action) as ActivityActionType,
        description: log.description || log.details?.description || log.action || "Activity performed",
        userId: log.user_id,
        userName: "User", // Simplified - no JOIN needed
        userEmail: "",
        timestamp: new Date(log.timestamp || log.created_at),
        metadata: {
          entityId: log.entity_id,
          entityType: log.entity_type,
          ...(log.metadata || log.details || {}),
        },
      })) as ActivityLog[];
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const createActivityLog = useMutation({
    mutationFn: async (logData: {
      module: ActivityModule;
      actionType: ActivityActionType;
      description: string;
      entityType?: string;
      entityId?: string;
      metadata?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: logData.actionType,
        module: logData.module,
        entity_type: logData.entityType,
        entity_id: logData.entityId,
        details: {
          description: logData.description,
          ...logData.metadata,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
    },
  });

  return {
    activityLogs: activityLogsQuery.data ?? [],
    isLoading: activityLogsQuery.isLoading,
    error: activityLogsQuery.error,
    createActivityLog: createActivityLog.mutateAsync,
  };
}

