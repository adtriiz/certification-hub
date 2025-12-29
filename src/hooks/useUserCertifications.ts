import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { FundingApplication, CompletedCertification } from "@/types/userCertifications";
import { toast } from "sonner";

export const useUserCertifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for internal certifications
  const { data: userCerts = [] } = useQuery({
    queryKey: ["user_certifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_certifications')
        .select(`
          *,
          certifications (certification_name, provider)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Defensive JS-level filtering as fallback
      return (data || []).filter((item: any) => item.user_id === user.id);
    },
    enabled: !!user
  });

  // Query for external certifications
  const { data: externalCerts = [] } = useQuery({
    queryKey: ["external_certifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('external_certifications')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data || []).filter((item: any) => item.user_id === user.id);
    },
    enabled: !!user
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async (): Promise<FundingApplication[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          certifications (certification_name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Defensive JS-level filtering as fallback
      const filteredData = (data || []).filter((item: any) => item.user_id === user.id);

      return filteredData.map(app => ({
        id: app.id,
        certificationId: app.certification_id,
        certificationName: app.certifications?.certification_name || "Unknown",
        status: app.status as "pending" | "approved" | "rejected",
        appliedAt: app.created_at,
        reason: app.reason || "Funding Requested",
        estimatedCost: Number(app.estimated_cost) || 0
      }));
    },
    enabled: !!user
  });

  // Derived state
  const favorites = userCerts
    .filter((c) => c.status === 'saved')
    .map((c) => c.certification_id);

  // Combine internal and external certifications
  const internalCompleted: CompletedCertification[] = userCerts
    .filter((c) => c.status === 'completed')
    .map((c) => ({
      id: c.id,
      certificationId: c.certification_id,
      certificationName: c.certifications?.certification_name || "Unknown",
      completedAt: c.completed_at || c.updated_at,
      credentialUrl: c.credential_url,
      provider: Array.isArray(c.certifications?.provider)
        ? c.certifications.provider.join(", ")
        : c.certifications?.provider,
      isExternal: false,
      expiresAt: c.expires_at
    }));

  const externalCompleted: CompletedCertification[] = externalCerts.map((c: any) => ({
    id: c.id,
    certificationId: c.id, // Use same id as certificationId for external
    certificationName: c.certification_name,
    completedAt: c.completed_at,
    credentialUrl: c.credential_url,
    provider: c.provider,
    isExternal: true,
    expiresAt: c.expires_at
  }));

  const completedCertifications: CompletedCertification[] = [
    ...internalCompleted,
    ...externalCompleted
  ];

  // Mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (certificationId: string) => {
      if (!user) throw new Error("Must be logged in");

      const isFav = favorites.includes(certificationId);
      if (isFav) {
        const { error } = await supabase
          .from('user_certifications')
          .delete()
          .eq('user_id', user.id)
          .eq('certification_id', certificationId)
          .eq('status', 'saved');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_certifications')
          .insert({
            user_id: user.id,
            certification_id: certificationId,
            status: 'saved'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_certifications"] });
    },
    onError: (err) => {
      toast.error("Failed to update favorite: " + err.message);
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (params: { certId: string, certName: string, reason: string, cost: number }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          certification_id: params.certId,
          status: 'pending',
          reason: params.reason,
          estimated_cost: params.cost
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (params: {
      certId: string,
      certName: string,
      completedAt: string,
      credentialUrl?: string,
      expiresAt?: string
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from('user_certifications')
        .insert({
          user_id: user.id,
          certification_id: params.certId,
          status: 'completed',
          completed_at: params.completedAt,
          credential_url: params.credentialUrl || null,
          expires_at: params.expiresAt || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_certifications"] });
    }
  });

  const externalCertMutation = useMutation({
    mutationFn: async (params: {
      certName: string,
      provider: string,
      completedAt: string,
      credentialUrl?: string,
      expiresAt?: string
    }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from('external_certifications')
        .insert({
          user_id: user.id,
          certification_name: params.certName,
          provider: params.provider,
          completed_at: params.completedAt,
          credential_url: params.credentialUrl || null,
          expires_at: params.expiresAt || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external_certifications"] });
    }
  });

  const removeCompleteMutation = useMutation({
    mutationFn: async ({ id, isExternal }: { id: string, isExternal: boolean }) => {
      if (isExternal) {
        const { error } = await supabase.from('external_certifications').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_certifications').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_certifications"] });
      queryClient.invalidateQueries({ queryKey: ["external_certifications"] });
    }
  });

  return {
    favorites,
    applications,
    completedCertifications,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isFavorite: (id: string) => favorites.includes(id),
    applyForFunding: (certificationId: string, certificationName: string, reason: string, estimatedCost: number) =>
      applyMutation.mutate({ certId: certificationId, certName: certificationName, reason, cost: estimatedCost }),
    hasApplied: (id: string) => applications.some(a => a.certificationId === id),
    getApplicationStatus: (id: string): "pending" | "approved" | "rejected" | null => {
      // Find the most recent application for this certification
      const certApps = applications.filter(a => a.certificationId === id);
      if (certApps.length === 0) return null;
      // Sort by appliedAt descending to get most recent
      const sorted = certApps.sort((a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
      return sorted[0].status;
    },
    addCompletedCertification: (
      certificationId: string,
      certificationName: string,
      completedAt: string,
      credentialUrl?: string,
      expiresAt?: string
    ) => completeMutation.mutate({
      certId: certificationId,
      certName: certificationName,
      completedAt,
      credentialUrl,
      expiresAt
    }),
    addExternalCertification: (
      certName: string,
      provider: string,
      completedAt: string,
      credentialUrl?: string,
      expiresAt?: string
    ) => externalCertMutation.mutate({
      certName,
      provider,
      completedAt,
      credentialUrl,
      expiresAt
    }),
    removeCompletedCertification: (id: string, isExternal: boolean) =>
      removeCompleteMutation.mutate({ id, isExternal }),
    isCompleted: (id: string) => completedCertifications.some(c => c.certificationId === id),
  };
};
