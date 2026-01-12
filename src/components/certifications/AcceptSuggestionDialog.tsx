import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AcceptSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (adminNotes: string) => void;
  suggestionName: string;
}

export const AcceptSuggestionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  suggestionName,
}: AcceptSuggestionDialogProps) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [hasAddedToSpreadsheet, setHasAddedToSpreadsheet] = useState(false);

  const handleConfirm = () => {
    if (!hasAddedToSpreadsheet) return;
    onConfirm(adminNotes);
    setAdminNotes("");
    setHasAddedToSpreadsheet(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setAdminNotes("");
    setHasAddedToSpreadsheet(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Accept Certification Suggestion</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to approve the certification: <strong>{suggestionName}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="spreadsheet-check"
                checked={hasAddedToSpreadsheet}
                onChange={(e) => setHasAddedToSpreadsheet(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="spreadsheet-check" className="text-sm">
                I have added this certification to the spreadsheet (source)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <Textarea
              id="adminNotes"
              placeholder="Add any notes about this approval..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!hasAddedToSpreadsheet}
          >
            Accept Suggestion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};