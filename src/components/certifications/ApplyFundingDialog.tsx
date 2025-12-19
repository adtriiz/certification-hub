import { useState } from "react";
import { GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Certification } from "@/data/certifications";

interface ApplyFundingDialogProps {
  certification: Certification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (certificationId: string, certificationName: string, reason: string, estimatedCost: number) => void;
  hasAlreadyApplied: boolean;
}

export const ApplyFundingDialog = ({
  certification,
  open,
  onOpenChange,
  onApply,
  hasAlreadyApplied,
}: ApplyFundingDialogProps) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!certification || !reason.trim()) return;
    onApply(certification.id, certification.certificationName, reason, certification.priceInEUR);
    setReason("");
    onOpenChange(false);
  };

  if (!certification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Apply for Funding
          </DialogTitle>
          <DialogDescription>
            Submit a request for certification funding approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Certification</Label>
            <p className="font-medium">{certification.certificationName}</p>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Provider:</span>{" "}
              <span className="font-medium">{certification.provider.join(", ")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cost:</span>{" "}
              <span className="font-medium">€{certification.priceInEUR}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you want this certification?</Label>
            <Textarea
              id="reason"
              placeholder="Explain how this certification will benefit your role and career development..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {hasAlreadyApplied && (
            <p className="text-sm text-warning">
              You have already applied for funding for this certification.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || hasAlreadyApplied}
          >
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
