import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { FundingApplication, CompletedCertification } from "@/types/userCertifications";
import { toast } from "sonner";

export const useUserCertifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userCerts = [] } = useQuery({
    queryKey: ["user_certifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_certifications')
        .select(`
          *,
          certifications (certification_name)
        `);
      if (error) throw error;
      return data;
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
        `);

      if (error) throw error;

      return data.map(app => ({
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

  const completedCertifications: CompletedCertification[] = userCerts
    .filter((c) => c.status === 'completed')
    .map((c) => ({
      id: c.id,
      certificationId: c.certification_id,
      certificationName: c.certifications?.certification_name || "Unknown",
      completedAt: c.updated_at,
      expiresAt: undefined
    }));


  // Mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (certificationId: string) => {
      if (!user) throw new Error("Must be logged in");

      const isFav = favorites.includes(certificationId);
      if (isFav) {
        // Delete
        // We need to find the record ID or delete by matches
        const { error } = await supabase
          .from('user_certifications')
          .delete()
          .eq('user_id', user.id)
          .eq('certification_id', certificationId)
          .eq('status', 'saved');
        if (error) throw error;
      } else {
        // Insert
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
    mutationFn: async (params: { certId: string, certName: string, expiresAt?: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from('user_certifications')
        .insert({
          user_id: user.id,
          certification_id: params.certId,
          status: 'completed'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_certifications"] });
    }
  });

  const removeCompleteMutation = useMutation({
    mutationFn: async (completedCertId: string) => { // This relies on the record ID
      const { error } = await supabase.from('user_certifications').delete().eq('id', completedCertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_certifications"] });
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
    addCompletedCertification: (certificationId: string, certificationName: string, expiresAt?: string) =>
      completeMutation.mutate({ certId: certificationId, certName: certificationName, expiresAt }),
    uploadProof: () => console.log("Upload proof not implemented in basic version"),
    removeCompletedCertification: (id: string) => removeCompleteMutation.mutate(id),
    isCompleted: (id: string) => completedCertifications.some(c => c.certificationId === id),
  };
};
