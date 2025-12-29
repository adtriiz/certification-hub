import { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle2, XCircle, FileText, ChevronDown, ChevronRight, EyeOff, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FundingApplication } from "@/types/userCertifications";

interface MyApplicationsProps {
  applications: FundingApplication[];
}

// Status configuration - easily extensible for future statuses
const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
    sectionClassName: "border-warning/30",
    emptyMessage: "No pending applications",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
    sectionClassName: "border-success/30",
    emptyMessage: "No approved applications",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    sectionClassName: "border-destructive/30",
    emptyMessage: "No rejected applications",
  },
} as const;

// Order of statuses to display
const STATUS_ORDER: (keyof typeof statusConfig)[] = ["pending", "approved", "rejected"];

const HIDE_REJECTED_KEY = "myApplications.hideRejected";

interface StatusSectionProps {
  status: keyof typeof statusConfig;
  applications: FundingApplication[];
  isRejectedSection?: boolean;
  onHideRejected?: () => void;
}

const StatusSection = ({ status, applications, isRejectedSection, onHideRejected }: StatusSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const isEmpty = applications.length === 0;

  // Don't render empty rejected section
  if (isRejectedSection && isEmpty) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <div className={`flex items-center justify-between p-3 rounded-lg bg-card/60 border ${config.sectionClassName} backdrop-blur-sm`}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <StatusIcon className={`h-5 w-5 ${config.className.split(' ')[1]}`} />
            <span className="font-medium text-foreground">{config.label}</span>
            <Badge variant="secondary" className="ml-1">
              {applications.length}
            </Badge>
          </button>
        </CollapsibleTrigger>

        {isRejectedSection && applications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHideRejected}
            className="text-muted-foreground hover:text-foreground gap-1.5 h-8"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span className="text-xs">Hide</span>
          </Button>
        )}
      </div>

      <CollapsibleContent className="space-y-3">
        {isEmpty ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {config.emptyMessage}
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface ApplicationCardProps {
  application: FundingApplication;
}

const ApplicationCard = ({ application }: ApplicationCardProps) => {
  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <Card className="ml-7">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{application.certificationName}</CardTitle>
          <Badge variant="outline" className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Requested:</span>{" "}
            <span className="font-medium">€{application.estimatedCost}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Applied:</span>{" "}
            <span className="font-medium">
              {new Date(application.appliedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Reason:</span>
          <p className="mt-1 text-foreground">{application.reason}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const MyApplications = ({ applications }: MyApplicationsProps) => {
  const [hideRejected, setHideRejected] = useState(() => {
    const stored = localStorage.getItem(HIDE_REJECTED_KEY);
    return stored === "true";
  });

  // Persist hideRejected to localStorage
  useEffect(() => {
    localStorage.setItem(HIDE_REJECTED_KEY, String(hideRejected));
  }, [hideRejected]);

  // Group applications by status
  const groupedApplications = useMemo(() => {
    const groups: Record<string, FundingApplication[]> = {
      pending: [],
      approved: [],
      rejected: [],
    };

    applications.forEach((app) => {
      if (groups[app.status]) {
        groups[app.status].push(app);
      }
    });

    return groups;
  }, [applications]);

  const rejectedCount = groupedApplications.rejected.length;

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
    <div className="space-y-6">
      {STATUS_ORDER.map((status) => {
        // Skip rejected section if hidden
        if (status === "rejected" && hideRejected) {
          return null;
        }

        return (
          <StatusSection
            key={status}
            status={status}
            applications={groupedApplications[status]}
            isRejectedSection={status === "rejected"}
            onHideRejected={() => setHideRejected(true)}
          />
        );
      })}

      {/* Hidden rejected banner */}
      {hideRejected && rejectedCount > 0 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border border-border/60 text-sm text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          <span>{rejectedCount} rejected application{rejectedCount !== 1 ? "s" : ""} hidden</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setHideRejected(false)}
            className="text-primary h-auto p-0 ml-1"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Show
          </Button>
        </div>
      )}
    </div>
  );
};
