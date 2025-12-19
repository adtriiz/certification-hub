import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, FileText, GraduationCap, Plus, Sparkles, LogIn, LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import { MyApplications } from "@/components/certifications/MyApplications";
import { MyCertifications } from "@/components/certifications/MyCertifications";
import { ApplyFundingDialog } from "@/components/certifications/ApplyFundingDialog";
import { AddCertificationDialog } from "@/components/certifications/AddCertificationDialog";
import { CertificationsBrowser } from "@/components/certifications/CertificationsBrowser";
import { Certification } from "@/data/certifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserCertifications } from "@/hooks/useUserCertifications";
import { useCertificationsFilter } from "@/hooks/useCertificationsFilter";
import { useCertifications } from "@/hooks/useCertifications";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const [applyDialogCert, setApplyDialogCert] = useState<Certification | null>(null);
  const [showAddCertDialog, setShowAddCertDialog] = useState(false);
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();

  const { toast } = useToast();

  const { data: certifications = [], isLoading: certsLoading } = useCertifications();

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

  const {
    searchQuery,
    setSearchQuery,
    showFavoritesOnly,
    setShowFavoritesOnly,
    filters,
    handleFilterChange,
    handleClearFilters,
    filterOptions,
    filteredCertifications,
  } = useCertificationsFilter(certifications, isFavorite);

  console.log("Index render:", {
    certsCount: certifications.length,
    user: !!user,
    filteredCount: filteredCertifications.length,
    authLoading,
    certsLoading
  });

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

  if (certsLoading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fade-up flex items-end gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-warm">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
                  Certification Portal
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              {!user ? (
                <Link to="/login">
                  <Button variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </Link>
              ) : (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" onClick={() => signOut()} className="gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              )}
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
              {user && (
                <>
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
                </>
              )}
            </TabsList>
          </div>

          <CertificationsBrowser
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            filters={filters}
            handleFilterChange={handleFilterChange}
            handleClearFilters={handleClearFilters}
            filterOptions={filterOptions}
            totalCertifications={certifications.length}
            filteredCertifications={filteredCertifications}
            favoritesCount={favorites.length}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onApplyFunding={setApplyDialogCert}
            hasApplied={hasApplied}
            isCompleted={isCompleted}
          />

          {user && (
            <>
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
            </>
          )}
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
        certifications={certifications}
        completedIds={completedCertifications.map((c) => c.certificationId)}
        onAdd={handleAddCertification}
      />
    </div>
  );
};

export default Index;
