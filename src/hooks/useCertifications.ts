import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Certification } from "@/data/certifications";

export const useCertifications = () => {
    return useQuery({
        queryKey: ["certifications"],
        queryFn: async (): Promise<Certification[]> => {
            const { data, error } = await supabase
                .from('certifications')
                .select('*');

            if (error) throw error;

            return (data || []).map((item) => ({
                id: item.id,
                certificationName: item.certification_name || "",
                domain: item.domain || "",
                languageFramework: item.language_framework ? item.language_framework.split(",").map((s: string) => s.trim()) : [],
                url: item.url || "",
                provider: item.provider ? item.provider.split(",").map((s: string) => s.trim()) : [],
                price: Number(item.price) || 0,
                currency: item.currency || "USD",
                experienceLevel: item.experience_level || "",
                certificateQuality: item.certificate_quality || "",
                lastChecked: item.last_checked || new Date().toISOString(),
                notes: item.notes || "",
                priceInEUR: Number(item.price_in_eur) || 0
            }));
        }
    });
};
