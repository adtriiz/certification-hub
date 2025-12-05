import { Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FundingApplication } from "@/types/userCertifications";

interface MyApplicationsProps {
  applications: FundingApplication[];
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const MyApplications = ({ applications }: MyApplicationsProps) => {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground">
          Browse certifications and apply for funding to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((app) => {
        const status = statusConfig[app.status];
        const StatusIcon = status.icon;
        return (
          <Card key={app.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{app.certificationName}</CardTitle>
                <Badge variant="outline" className={status.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Requested:</span>{" "}
                  <span className="font-medium">€{app.estimatedCost}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Applied:</span>{" "}
                  <span className="font-medium">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Reason:</span>
                <p className="mt-1 text-foreground">{app.reason}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
