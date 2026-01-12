import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { SearchBar } from "./SearchBar";
import { FilterBar, Filters } from "./FilterBar";
import { MemoizedCertificationsTable as CertificationsTable } from "./CertificationsTable";
import { SuggestCertificationDialog } from "./SuggestCertificationDialog";
import { Certification } from "@/data/certifications";
import { useCertificationSuggestions } from "@/hooks/useCertificationSuggestions";

interface CertificationsBrowserProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showFavoritesOnly: boolean;
    setShowFavoritesOnly: (show: boolean) => void;
    filters: Filters;
    handleFilterChange: (key: keyof Filters, value: string) => void;
    handleClearFilters: () => void;
    filterOptions: {
        domains: string[];
        languages: string[];
        providers: string[];
        experienceLevels: string[];
        qualities: string[];
    };
    totalCertifications: number;
    filteredCertifications: Certification[];
    favoritesCount: number;
    onToggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
    onApplyFunding: (cert: Certification) => void;
    hasApplied: (id: string) => boolean;
    getApplicationStatus: (id: string) => "pending" | "approved" | "rejected" | null;
    isCompleted: (id: string) => boolean;
}

export const CertificationsBrowser = ({
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filters,
    handleFilterChange,
    handleClearFilters,
    filterOptions,
    totalCertifications,
    filteredCertifications,
    favoritesCount,
    onToggleFavorite,
    isFavorite,
    onApplyFunding,
    hasApplied,
    getApplicationStatus,
    isCompleted,
}: CertificationsBrowserProps) => {
    const [showSuggestDialog, setShowSuggestDialog] = useState(false);
    const { suggestCertification } = useCertificationSuggestions();

    const handleSuggestCertification = (
        certificationName: string,
        provider: string,
        reason: string,
        url: string
    ) => {
        suggestCertification(certificationName, provider, reason, url);
    };
    return (
        <TabsContent value="browse" className="space-y-6">
            {/* Search and Stats */}
            <div className="animate-fade-up animate-stagger-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    <Button
                        variant={showFavoritesOnly ? "default" : "outline"}
                        size="icon"
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className="shrink-0 h-11 w-11 rounded-xl hover-lift"
                    >
                        <Heart className={showFavoritesOnly ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                    </Button>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl hover-lift border-border/60 hover:border-primary/40"
                        onClick={() => setShowSuggestDialog(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Suggest Certification
                    </Button>
                    
                    <span className="font-medium">
                        <Badge variant="outline" className="font-mono text-foreground mr-1">
                            {filteredCertifications.length}
                        </Badge>
                        of {totalCertifications} certifications
                    </span>
                    {favoritesCount > 0 && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                            <Heart className="h-3 w-3 fill-current" />
                            {favoritesCount}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="animate-fade-up animate-stagger-3">
                <FilterBar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    options={filterOptions}
                />
            </div>

            {/* Table */}
            <div className="animate-fade-up animate-stagger-4">
                <CertificationsTable
                    certifications={filteredCertifications}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={isFavorite}
                    onApplyFunding={onApplyFunding}
                    hasApplied={hasApplied}
                    getApplicationStatus={getApplicationStatus}
                    isCompleted={isCompleted}
                />
            </div>

            {/* Suggest Certification Dialog */}
            <SuggestCertificationDialog
                open={showSuggestDialog}
                onOpenChange={setShowSuggestDialog}
                onSuggest={handleSuggestCertification}
            />
        </TabsContent>
    );
};
