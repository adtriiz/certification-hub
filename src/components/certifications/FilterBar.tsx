import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "./FilterSelect";

export interface Filters {
  area: string;
  languageFramework: string;
  provider: string;
  level: string;
  quality: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  options: {
    areas: string[];
    languages: string[];
    providers: string[];
    levels: string[];
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
    <div className="flex flex-wrap items-end gap-4">
      <FilterSelect
        label="Area"
        value={filters.area}
        options={options.areas}
        onChange={(v) => onFilterChange("area", v)}
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
        label="Level"
        value={filters.level}
        options={options.levels}
        onChange={(v) => onFilterChange("level", v)}
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
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
};
