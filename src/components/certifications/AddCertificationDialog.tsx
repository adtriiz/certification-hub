import { useState } from "react";
import { Award, Search, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Certification } from "@/data/certifications";

interface AddCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certifications: Certification[];
  completedIds: string[];
  onAdd: (
    certificationId: string,
    certificationName: string,
    completedAt: string,
    credentialUrl?: string,
    expiresAt?: string
  ) => void;
  onAddExternal: (
    certName: string,
    provider: string,
    completedAt: string,
    credentialUrl?: string,
    expiresAt?: string
  ) => void;
}

export const AddCertificationDialog = ({
  open,
  onOpenChange,
  certifications,
  completedIds,
  onAdd,
  onAddExternal,
}: AddCertificationDialogProps) => {
  const [isExternal, setIsExternal] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Certification | null>(null);

  // Form fields
  const [externalName, setExternalName] = useState("");
  const [externalProvider, setExternalProvider] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const filteredCerts = certifications.filter(
    (cert) =>
      !completedIds.includes(cert.id) &&
      cert.certificationName.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setSelected(null);
    setExternalName("");
    setExternalProvider("");
    setCompletedAt("");
    setCredentialUrl("");
    setExpiresAt("");
    setSearch("");
    setIsExternal(false);
  };

  const handleAdd = () => {
    if (isExternal) {
      if (!externalName || !externalProvider || !completedAt) return;
      onAddExternal(
        externalName,
        externalProvider,
        completedAt,
        credentialUrl || undefined,
        expiresAt || undefined
      );
    } else {
      if (!selected || !completedAt) return;
      onAdd(
        selected.id,
        selected.certificationName,
        completedAt,
        credentialUrl || undefined,
        expiresAt || undefined
      );
    }
    resetForm();
    onOpenChange(false);
  };

  const canSubmit = isExternal
    ? externalName && externalProvider && completedAt
    : selected && completedAt;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Add Completed Certification
          </DialogTitle>
          <DialogDescription>
            Record a certification you've completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* External certification toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="external-toggle" className="text-sm font-medium">
                External Certification
              </Label>
              <p className="text-xs text-muted-foreground">
                Toggle on if this certification is not in our catalog
              </p>
            </div>
            <Switch
              id="external-toggle"
              checked={isExternal}
              onCheckedChange={(checked) => {
                setIsExternal(checked);
                setSelected(null);
              }}
            />
          </div>

          {/* Certification selection / input */}
          {isExternal ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-name">Certification Name *</Label>
                <Input
                  id="cert-name"
                  placeholder="e.g., AWS Solutions Architect"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider / Issuer *</Label>
                <Input
                  id="provider"
                  placeholder="e.g., Amazon Web Services"
                  value={externalProvider}
                  onChange={(e) => setExternalProvider(e.target.value)}
                />
              </div>
            </div>
          ) : !selected ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-2 space-y-1">
                  {filteredCerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No matching certifications found.
                    </p>
                  ) : (
                    filteredCerts.map((cert) => (
                      <button
                        key={cert.id}
                        onClick={() => setSelected(cert)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <p className="font-medium text-sm">{cert.certificationName}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.provider.join(", ")} • {cert.experienceLevel}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Selected Certification</Label>
              <div className="p-3 rounded-md bg-accent/50 border">
                <p className="font-medium">{selected.certificationName}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.provider.join(", ")} • {selected.experienceLevel}
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="px-0 h-auto"
                onClick={() => setSelected(null)}
              >
                Choose different certification
              </Button>
            </div>
          )}

          {/* Common fields - show when external OR when a cert is selected */}
          {(isExternal || selected) && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="completed-at">Completion Date *</Label>
                <Input
                  id="completed-at"
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credential-url" className="flex items-center gap-1">
                  Credential URL
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  id="credential-url"
                  type="url"
                  placeholder="https://credly.com/badges/..."
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add a link to your badge or credential if available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires-at">Expiration Date (optional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!canSubmit}>
            Add Certification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
