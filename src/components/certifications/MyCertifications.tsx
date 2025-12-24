import { Award, Calendar, Trash2, ExternalLink, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompletedCertification } from "@/types/userCertifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MyCertificationsProps {
  certifications: CompletedCertification[];
  onRemove: (certId: string, isExternal: boolean) => void;
}

export const MyCertifications = ({
  certifications,
  onRemove,
}: MyCertificationsProps) => {

  if (certifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Certifications Yet</h3>
        <p className="text-muted-foreground">
          Complete certifications and add them here to track your achievements.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {certifications.map((cert) => (
        <Card key={cert.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{cert.certificationName}</CardTitle>
                {cert.provider && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {cert.provider}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {cert.isExternal && (
                  <Badge variant="secondary" className="text-xs">
                    External
                  </Badge>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Certification?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the certification from your profile. You can add it again later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRemove(cert.id, cert.isExternal)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Completed: {new Date(cert.completedAt).toLocaleDateString()}
              </div>
              {cert.expiresAt && (
                <div className="text-muted-foreground">
                  Expires: {new Date(cert.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Credential
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
