import { useState } from "react";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, GraduationCap, CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Certification } from "@/data/certifications";
import { FavoriteButton } from "./FavoriteButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CertificationsTableProps {
  certifications: Certification[];
  onToggleFavorite?: (id: string) => void;
  isFavorite?: (id: string) => boolean;
  onApplyFunding?: (cert: Certification) => void;
  hasApplied?: (id: string) => boolean;
  isCompleted?: (id: string) => boolean;
}

type SortKey = keyof Certification;
type SortDirection = "asc" | "desc" | null;

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "foundation":
      return "bg-secondary text-secondary-foreground border-border";
    case "associate":
      return "bg-info/10 text-info border-info/30";
    case "intermediate":
      return "bg-warning/10 text-warning border-warning/30";
    case "professional":
      return "bg-primary/10 text-primary border-primary/30";
    case "expert":
      return "bg-accent/10 text-accent border-accent/30";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
};

const getQualityColor = (quality: string) => {
  switch (quality.toLowerCase()) {
    case "high":
      return "bg-success/10 text-success border-success/30";
    case "medium":
      return "bg-warning/10 text-warning border-warning/30";
    case "low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
};

export const CertificationsTable = ({
  certifications,
  onToggleFavorite,
  isFavorite,
  onApplyFunding,
  hasApplied,
  isCompleted,
}: CertificationsTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedCertifications = [...certifications].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3 text-primary" />
      : <ArrowDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-semibold hover:bg-transparent hover:text-primary transition-colors"
      onClick={() => handleSort(columnKey)}
    >
      {children}
      <SortIcon columnKey={columnKey} />
    </Button>
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header border-b border-border/60">
              {onToggleFavorite && <TableHead className="w-[50px]"></TableHead>}
              <TableHead className="min-w-[250px]">
                <SortableHeader columnKey="certificationName">Name</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <SortableHeader columnKey="area">Area</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <SortableHeader columnKey="languageFramework">Language</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <SortableHeader columnKey="provider">Provider</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <SortableHeader columnKey="level">Level</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[80px]">
                <SortableHeader columnKey="certificateQuality">Quality</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[100px] text-right">
                <SortableHeader columnKey="priceInEUR">Price (EUR)</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCertifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onToggleFavorite ? 10 : 9} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="h-8 w-8 opacity-30" />
                    <span>No certifications found matching your filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedCertifications.map((cert, index) => {
                const applied = hasApplied?.(cert.id);
                const completed = isCompleted?.(cert.id);
                return (
                  <TableRow 
                    key={cert.id} 
                    className="hover:bg-table-row-hover transition-colors border-b border-border/40"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    {onToggleFavorite && isFavorite && (
                      <TableCell>
                        <FavoriteButton
                          isFavorite={isFavorite(cert.id)}
                          onToggle={() => onToggleFavorite(cert.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{cert.certificationName}</span>
                        {completed && (
                          <Tooltip>
                            <TooltipTrigger>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            </TooltipTrigger>
                            <TooltipContent>You've completed this certification</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-border/60">
                        {cert.area}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cert.languageFramework}</TableCell>
                    <TableCell className="text-muted-foreground">{cert.provider}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getLevelColor(cert.level)}>
                        {cert.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getQualityColor(cert.certificateQuality)}>
                        {cert.certificateQuality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">€{cert.priceInEUR}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onApplyFunding && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={applied ? "secondary" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={() => onApplyFunding(cert)}
                                disabled={applied}
                              >
                                <GraduationCap className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {applied ? "Application submitted" : "Apply for funding"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                              asChild
                            >
                              <a href={cert.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open certification page</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
