import { useState, useMemo } from "react";
import { Award, Database, Heart, FileText, GraduationCap, Plus } from "lucide-react";
import { SearchBar } from "@/components/certifications/SearchBar";
import { FilterBar, Filters } from "@/components/certifications/FilterBar";
import { CertificationsTable } from "@/components/certifications/CertificationsTable";
import { MyApplications } from "@/components/certifications/MyApplications";
import { MyCertifications } from "@/components/certifications/MyCertifications";
import { ApplyFundingDialog } from "@/components/certifications/ApplyFundingDialog";
import { AddCertificationDialog } from "@/components/certifications/AddCertificationDialog";
import {
  mockCertifications,
  getUniqueAreas,
  getUniqueLanguages,
  getUniqueProviders,
  getUniqueLevels,
  getUniqueQualities,
  Certification,
} from "@/data/certifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserCertifications } from "@/hooks/useUserCertifications";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    languageFramework: "all",
    provider: "all",
    level: "all",
    quality: "all",
  });
  const [applyDialogCert, setApplyDialogCert] = useState<Certification | null>(null);
  const [showAddCertDialog, setShowAddCertDialog] = useState(false);

  const { toast } = useToast();
  const {
    favorites,
    applications,
    completedCertifications,
    toggleFavorite,
    isFavorite,
    applyForFunding,
    hasApplied,
    addCompletedCertification,
    uploadProof,
    removeCompletedCertification,
    isCompleted,
  } = useUserCertifications();

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
      // Favorites filter
      if (showFavoritesOnly && !isFavorite(cert.id)) return false;

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
  }, [searchQuery, filters, showFavoritesOnly, isFavorite]);

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
    setShowFavoritesOnly(false);
  };

  const handleApplyFunding = (certId: string, certName: string, reason: string, cost: number) => {
    applyForFunding(certId, certName, reason, cost);
    toast({
      title: "Application Submitted",
      description: `Your funding request for ${certName} has been submitted for review.`,
    });
  };

  const handleAddCertification = (certId: string, certName: string, expiresAt?: string) => {
    addCompletedCertification(certId, certName, expiresAt);
    toast({
      title: "Certification Added",
      description: `${certName} has been added to your certifications.`,
    });
  };

  const handleUploadProof = (certId: string, fileName: string) => {
    uploadProof(certId, fileName);
    toast({
      title: "Proof Uploaded",
      description: `${fileName} has been attached to your certification.`,
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
                Certification Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse, apply for funding, and track your certifications
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse" className="gap-2">
              <Database className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              My Applications
              {applications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {applications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certifications" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              My Certifications
              {completedCertifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedCertifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="shrink-0"
                >
                  <Heart className={showFavoritesOnly ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing{" "}
                  <Badge variant="secondary" className="font-mono">
                    {filteredCertifications.length}
                  </Badge>{" "}
                  of {mockCertifications.length} certifications
                </span>
                {favorites.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Heart className="h-3 w-3" />
                    {favorites.length} favorites
                  </Badge>
                )}
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
            <CertificationsTable
              certifications={filteredCertifications}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onApplyFunding={setApplyDialogCert}
              hasApplied={hasApplied}
              isCompleted={isCompleted}
            />
          </TabsContent>

          <TabsContent value="applications">
            <MyApplications applications={applications} />
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddCertDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Certification
              </Button>
            </div>
            <MyCertifications
              certifications={completedCertifications}
              onUploadProof={handleUploadProof}
              onRemove={removeCompletedCertification}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <ApplyFundingDialog
        certification={applyDialogCert}
        open={!!applyDialogCert}
        onOpenChange={(open) => !open && setApplyDialogCert(null)}
        onApply={handleApplyFunding}
        hasAlreadyApplied={applyDialogCert ? hasApplied(applyDialogCert.id) : false}
      />

      <AddCertificationDialog
        open={showAddCertDialog}
        onOpenChange={setShowAddCertDialog}
        certifications={mockCertifications}
        completedIds={completedCertifications.map((c) => c.certificationId)}
        onAdd={handleAddCertification}
      />
    </div>
  );
};

export default Index;
