import { useState, useMemo } from "react";
import {
    getUniqueDomains,
    getUniqueLanguages,
    getUniqueProviders,
    getUniqueExperienceLevels,
    getUniqueQualities,
    Certification
} from "@/data/certifications";
import { Filters } from "@/components/certifications/FilterBar";

export const useCertificationsFilter = (certifications: Certification[], isFavorite: (id: string) => boolean) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        domain: "all",
        languageFramework: "all",
        provider: "all",
        experienceLevel: "all",
        quality: "all",
    });

    const filterOptions = useMemo(
        () => ({
            domains: getUniqueDomains(certifications),
            languages: getUniqueLanguages(certifications),
            providers: getUniqueProviders(certifications),
            experienceLevels: getUniqueExperienceLevels(certifications),
            qualities: getUniqueQualities(certifications),
        }),
        [certifications]
    );

    const filteredCertifications = useMemo(() => {
        return certifications.filter((cert) => {
            if (showFavoritesOnly && !isFavorite(cert.id)) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const searchableText = [
                    cert.certificationName,
                    cert.domain,
                    cert.languageFramework.join(" "),
                    cert.provider.join(" "),
                    cert.experienceLevel,
                    cert.notes,
                ]
                    .join(" ")
                    .toLowerCase();
                if (!searchableText.includes(query)) return false;
            }

            if (filters.domain !== "all" && cert.domain !== filters.domain) return false;
            if (filters.languageFramework !== "all" && !cert.languageFramework.includes(filters.languageFramework)) return false;
            if (filters.provider !== "all" && !cert.provider.includes(filters.provider)) return false;
            if (filters.experienceLevel !== "all" && cert.experienceLevel !== filters.experienceLevel) return false;
            if (filters.quality !== "all" && cert.certificateQuality !== filters.quality) return false;

            return true;
        });
    }, [certifications, searchQuery, filters, showFavoritesOnly, isFavorite]);

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            domain: "all",
            languageFramework: "all",
            provider: "all",
            experienceLevel: "all",
            quality: "all",
        });
        setShowFavoritesOnly(false);
    };

    return {
        searchQuery,
        setSearchQuery,
        showFavoritesOnly,
        setShowFavoritesOnly,
        filters,
        handleFilterChange,
        handleClearFilters,
        filterOptions,
        filteredCertifications,
    };
};
