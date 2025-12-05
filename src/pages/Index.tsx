import { useState, useMemo } from "react";
import { Award, Database } from "lucide-react";
import { SearchBar } from "@/components/certifications/SearchBar";
import { FilterBar, Filters } from "@/components/certifications/FilterBar";
import { CertificationsTable } from "@/components/certifications/CertificationsTable";
import {
  mockCertifications,
  getUniqueAreas,
  getUniqueLanguages,
  getUniqueProviders,
  getUniqueLevels,
  getUniqueQualities,
} from "@/data/certifications";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    languageFramework: "all",
    provider: "all",
    level: "all",
    quality: "all",
  });

  const filterOptions = useMemo(
    () => ({
      areas: getUniqueAreas(mockCertifications),
      languages: getUniqueLanguages(mockCertifications),
      providers: getUniqueProviders(mockCertifications),
      levels: getUniqueLevels(mockCertifications),
      qualities: getUniqueQualities(mockCertifications),
    }),
    []
  );

  const filteredCertifications = useMemo(() => {
    return mockCertifications.filter((cert) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          cert.certificationName,
          cert.area,
          cert.languageFramework,
          cert.provider,
          cert.level,
          cert.notes,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Dropdown filters
      if (filters.area !== "all" && cert.area !== filters.area) return false;
      if (filters.languageFramework !== "all" && cert.languageFramework !== filters.languageFramework) return false;
      if (filters.provider !== "all" && cert.provider !== filters.provider) return false;
      if (filters.level !== "all" && cert.level !== filters.level) return false;
      if (filters.quality !== "all" && cert.certificateQuality !== filters.quality) return false;

      return true;
    });
  }, [searchQuery, filters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      area: "all",
      languageFramework: "all",
      provider: "all",
      level: "all",
      quality: "all",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Certification Catalog
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse and filter available certifications
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>
              Showing{" "}
              <Badge variant="secondary" className="font-mono">
                {filteredCertifications.length}
              </Badge>{" "}
              of {mockCertifications.length} certifications
            </span>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          options={filterOptions}
        />

        {/* Table */}
        <CertificationsTable certifications={filteredCertifications} />

        {/* Footer note about data source */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">
            📊 About Data Source
          </h3>
          <p className="text-sm text-muted-foreground">
            This is currently using mock data. To connect to your Google Spreadsheet:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>Enable Lovable Cloud for backend functionality</li>
            <li>Create an Edge Function to fetch data from Google Sheets API</li>
            <li>Use a service account or API key for authentication</li>
            <li>Set up automatic refresh intervals if needed</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Index;
