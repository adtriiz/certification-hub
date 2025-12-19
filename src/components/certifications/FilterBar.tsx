import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "./FilterSelect";

export interface Filters {
  domain: string;
  languageFramework: string;
  provider: string;
  experienceLevel: string;
  quality: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  options: {
    domains: string[];
    languages: string[];
    providers: string[];
    experienceLevels: string[];
    qualities: string[];
  };
}

export const FilterBar = ({
  filters,
  onFilterChange,
  onClearFilters,
  options
}: FilterBarProps) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== "all");

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/40">
      <FilterSelect
        label="Domain"
        value={filters.domain}
        options={options.domains}
        onChange={(v) => onFilterChange("domain", v)}
      />
      <FilterSelect
        label="Language / Framework"
        value={filters.languageFramework}
        options={options.languages}
        onChange={(v) => onFilterChange("languageFramework", v)}
      />
      <FilterSelect
        label="Provider"
        value={filters.provider}
        options={options.providers}
        onChange={(v) => onFilterChange("provider", v)}
      />
      <FilterSelect
        label="Experience Level"
        value={filters.experienceLevel}
        options={options.experienceLevels}
        onChange={(v) => onFilterChange("experienceLevel", v)}
      />
      <FilterSelect
        label="Quality"
        value={filters.quality}
        options={options.qualities}
        onChange={(v) => onFilterChange("quality", v)}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <X className="mr-1 h-4 w-4" />
          Clear all
        </Button>
      )}
    </div>
  );
};
