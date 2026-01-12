import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SuggestCertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggest: (certificationName: string, provider: string, reason: string, url: string) => void;
}

export const SuggestCertificationDialog = ({
  open,
  onOpenChange,
  onSuggest,
}: SuggestCertificationDialogProps) => {
  const [certificationName, setCertificationName] = useState("");
  const [provider, setProvider] = useState("");
  const [reason, setReason] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    if (!certificationName.trim() || !reason.trim() || !url.trim()) return;
    onSuggest(certificationName, provider, reason, url);
    setCertificationName("");
    setProvider("");
    setReason("");
    setUrl("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setCertificationName("");
    setProvider("");
    setReason("");
    setUrl("");
    onOpenChange(false);
  };

  const isFormValid = certificationName.trim() && reason.trim() && url.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Suggest New Certification
          </DialogTitle>
          <DialogDescription>
            Help us expand our certification library by suggesting new funding opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="certificationName">Certification Name *</Label>
            <Input
              id="certificationName"
              placeholder="e.g., AWS Certified Solutions Architect"
              value={certificationName}
              onChange={(e) => setCertificationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              placeholder="e.g., Amazon Web Services"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Certification URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/certification"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why should this certification be included? *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this certification would be valuable for team members and how it aligns with our professional development goals..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            Submit Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};