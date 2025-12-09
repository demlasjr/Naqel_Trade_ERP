import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActivityLog, ActivityModule, ActivityActionType } from "@/types/activityLog";

export function useActivityLogs() {
  const queryClient = useQueryClient();

  const activityLogsQuery = useQuery({
    queryKey: ["activityLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          user:profiles(id, name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      return data.map((log: any) => ({
        id: log.id,
        module: log.module as ActivityModule,
        actionType: log.action as ActivityActionType,
        description: log.details?.description || log.action || "Activity performed",
        userId: log.user_id,
        userName: log.user?.name || "Unknown",
        userEmail: log.user?.email || "",
        timestamp: new Date(log.created_at),
        metadata: {
          entityId: log.entity_id,
          entityType: log.entity_type,
          ...log.details,
        },
      })) as ActivityLog[];
    },
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

