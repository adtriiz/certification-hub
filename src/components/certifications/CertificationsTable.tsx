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

const getLevelIndex = (level: string): number => {
  const levels = ["foundation", "associate", "intermediate", "professional", "expert"];
  return levels.indexOf(level.toLowerCase());
};

const LevelMeter = ({ level }: { level: string }) => {
  const index = getLevelIndex(level);
  const segments = 5;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-1.5 rounded-sm transition-colors ${
              i <= index 
                ? "bg-primary" 
                : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="ml-1.5 text-xs text-muted-foreground capitalize">{level}</span>
    </div>
  );
};

const QualitySeal = ({ quality }: { quality: string }) => {
  const getConfig = () => {
    switch (quality.toLowerCase()) {
      case "high":
        return { color: "text-success", bg: "bg-success/10", ring: "ring-success/20", label: "★★★" };
      case "medium":
        return { color: "text-warning", bg: "bg-warning/10", ring: "ring-warning/20", label: "★★" };
      case "low":
        return { color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", label: "★" };
      default:
        return { color: "text-muted-foreground", bg: "bg-muted", ring: "ring-border", label: "–" };
    }
  };
  
  const config = getConfig();
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ring-1 ${config.ring}`}>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
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
              <TableHead className="min-w-[100px]">
                <SortableHeader columnKey="priceInEUR">Price</SortableHeader>
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
                      <LevelMeter level={cert.level} />
                    </TableCell>
                    <TableCell>
                      <QualitySeal quality={cert.certificateQuality} />
                    </TableCell>
                    <TableCell className="tabular-nums font-body font-semibold text-foreground">
                      {cert.priceInEUR.toLocaleString()}€
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onApplyFunding && (
                          applied ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/10 rounded-full">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Applied
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-full"
                              onClick={() => onApplyFunding(cert)}
                            >
                              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                              Apply
                            </Button>
                          )
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
