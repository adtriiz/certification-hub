import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CertificationSuggestion } from "@/types/userCertifications";
import { toast } from "sonner";

export const useCertificationSuggestions = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Query for user's own suggestions
  const { data: userSuggestions = [] } = useQuery({
    queryKey: ["user_suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('certification_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        certificationName: item.certification_name,
        provider: item.provider,
        reason: item.reason,
        url: item.url,
        status: item.status,
        adminNotes: item.admin_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        profiles: item.profiles
      })) as CertificationSuggestion[];
    },
    enabled: !!user
  });

  // Query for all suggestions (admin only)
  const { data: allSuggestions = [] } = useQuery({
    queryKey: ["all_certification_suggestions"],
    queryFn: async () => {
      if (!isAdmin) return [];
      const { data, error } = await supabase
        .from('certification_suggestions')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        userId: item.user_id,
        certificationName: item.certification_name,
        provider: item.provider,
        reason: item.reason,
        url: item.url,
        status: item.status,
        adminNotes: item.admin_notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        profiles: item.profiles
      })) as CertificationSuggestion[];
    },
    enabled: !!isAdmin
  });

  // Mutation for submitting suggestions
  const suggestMutation = useMutation({
    mutationFn: async (params: { 
      certificationName: string; 
      provider: string; 
      reason: string; 
      url: string 
    }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from('certification_suggestions')
        .insert({
          user_id: user.id,
          certification_name: params.certificationName,
          provider: params.provider || null,
          reason: params.reason,
          url: params.url,
          status: 'pending'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["all_certification_suggestions"] });
      toast.success("Certification suggestion submitted successfully!");
    },
    onError: (err) => {
      toast.error("Failed to submit suggestion: " + err.message);
    }
  });

  // Mutation for updating suggestion status (admin only)
  const updateStatusMutation = useMutation({
    mutationFn: async (params: { 
      id: string; 
      status: 'approved' | 'rejected'; 
      adminNotes?: string 
    }) => {
      if (!isAdmin) throw new Error("Admin access required");
      
      const { error } = await supabase
        .from('certification_suggestions')
        .update({
          status: params.status,
          admin_notes: params.adminNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_certification_suggestions"] });
      toast.success("Suggestion status updated successfully!");
    },
    onError: (err) => {
      toast.error("Failed to update suggestion: " + err.message);
    }
  });

  return {
    userSuggestions,
    allSuggestions,
    suggestCertification: (
      certificationName: string,
      provider: string,
      reason: string,
      url: string
    ) => suggestMutation.mutate({
      certificationName,
      provider,
      reason,
      url
    }),
    updateSuggestionStatus: (
      id: string,
      status: 'approved' | 'rejected',
      adminNotes?: string
    ) => updateStatusMutation.mutate({
      id,
      status,
      adminNotes
    }),
    isSubmitting: suggestMutation.isPending,
    isUpdating: updateStatusMutation.isPending
  };
};