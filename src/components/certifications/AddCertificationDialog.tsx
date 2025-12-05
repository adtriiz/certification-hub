import { useState } from "react";
import { Award, Search } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Certification } from "@/data/certifications";

interface AddCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certifications: Certification[];
  completedIds: string[];
  onAdd: (certificationId: string, certificationName: string, expiresAt?: string) => void;
}

export const AddCertificationDialog = ({
  open,
  onOpenChange,
  certifications,
  completedIds,
  onAdd,
}: AddCertificationDialogProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Certification | null>(null);
  const [expiresAt, setExpiresAt] = useState("");

  const filteredCerts = certifications.filter(
    (cert) =>
      !completedIds.includes(cert.id) &&
      cert.certificationName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.id, selected.certificationName, expiresAt || undefined);
    setSelected(null);
    setExpiresAt("");
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {!selected ? (
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
              <ScrollArea className="h-[250px] rounded-md border">
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
                          {cert.provider} • {cert.level}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Selected Certification</Label>
                <div className="p-3 rounded-md bg-accent/50 border">
                  <p className="font-medium">{selected.certificationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.provider} • {selected.level}
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
              <div className="space-y-2">
                <Label htmlFor="expires">Expiration Date (optional)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected}>
            Add Certification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
