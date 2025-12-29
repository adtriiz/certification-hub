import { useState, useEffect } from "react";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, GraduationCap, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { LevelMeter } from "@/components/ui/level-meter";
import { QualitySeal } from "@/components/ui/quality-seal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset to page 1 when certifications change (e.g., filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [certifications]);

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

  // Pagination calculations
  const totalPages = Math.ceil(sortedCertifications.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCertifications = sortedCertifications.slice(startIndex, startIndex + pageSize);

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
                <SortableHeader columnKey="domain">Domain</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <SortableHeader columnKey="languageFramework">Language</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <SortableHeader columnKey="provider">Provider</SortableHeader>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <SortableHeader columnKey="experienceLevel">Experience Level</SortableHeader>
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
              paginatedCertifications.map((cert, index) => {
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
                        {cert.domain}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cert.languageFramework.join(", ")}</TableCell>
                    <TableCell className="text-muted-foreground">{cert.provider.join(", ")}</TableCell>
                    <TableCell>
                      <LevelMeter level={cert.experienceLevel} />
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
                              <GraduationCap className="h-3.5 w-3.5 mr-0.5" />
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

      {/* Pagination Controls */}
      {sortedCertifications.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-border/60">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-9 rounded-lg border-border/60 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>

          {/* Page Info & Navigation */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}–{Math.min(startIndex + pageSize, sortedCertifications.length)} of {sortedCertifications.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="icon"
                      className={`h-9 w-9 rounded-lg transition-all ${currentPage === pageNum
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-primary/10 hover:text-primary"
                        }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
