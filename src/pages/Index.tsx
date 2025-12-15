import { useState, useMemo } from "react";
import { Award, Heart, FileText, GraduationCap, Plus, Sparkles } from "lucide-react";
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
      if (showFavoritesOnly && !isFavorite(cert.id)) return false;

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
    <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="container py-8">
          <div className="animate-fade-up flex items-end gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-warm">
              <Award className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-4xl text-foreground tracking-tight">
                Certification Portal
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover opportunities, apply for funding, track your growth
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container py-8">
        <Tabs defaultValue="browse" className="space-y-8">
          <div className="animate-fade-up animate-stagger-1">
            <TabsList className="bg-card/80 backdrop-blur-sm border border-border/60 p-1 shadow-soft">
              <TabsTrigger value="browse" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sparkles className="h-4 w-4" />
                Browse
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                My Applications
                {applications.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-accent text-accent-foreground">
                    {applications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="certifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
                My Certifications
                {completedCertifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-accent text-accent-foreground">
                    {completedCertifications.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

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
                <span className="font-medium">
                  <Badge variant="outline" className="font-mono text-foreground mr-1">
                    {filteredCertifications.length}
                  </Badge>
                  of {mockCertifications.length} certifications
                </span>
                {favorites.length > 0 && (
                  <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                    <Heart className="h-3 w-3 fill-current" />
                    {favorites.length}
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
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite}
                onApplyFunding={setApplyDialogCert}
                hasApplied={hasApplied}
                isCompleted={isCompleted}
              />
            </div>
          </TabsContent>

          <TabsContent value="applications" className="animate-fade-up">
            <MyApplications applications={applications} />
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6 animate-fade-up">
            <div className="flex justify-end">
              <Button onClick={() => setShowAddCertDialog(true)} className="gap-2 rounded-xl shadow-soft hover-lift">
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
