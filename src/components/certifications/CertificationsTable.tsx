import { useState } from "react";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

interface CertificationsTableProps {
  certifications: Certification[];
}

type SortKey = keyof Certification;
type SortDirection = "asc" | "desc" | null;

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "foundation":
      return "bg-secondary text-secondary-foreground";
    case "associate":
      return "bg-info/10 text-info border-info/20";
    case "intermediate":
      return "bg-warning/10 text-warning border-warning/20";
    case "professional":
      return "bg-primary/10 text-primary border-primary/20";
    case "expert":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getQualityColor = (quality: string) => {
  switch (quality.toLowerCase()) {
    case "high":
      return "bg-success/10 text-success border-success/20";
    case "medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export const CertificationsTable = ({ certifications }: CertificationsTableProps) => {
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
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-semibold hover:bg-transparent"
      onClick={() => handleSort(columnKey)}
    >
      {children}
      <SortIcon columnKey={columnKey} />
    </Button>
  );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
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
              <TableHead className="min-w-[200px]">Notes</TableHead>
              <TableHead className="w-[80px]">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCertifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No certifications found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedCertifications.map((cert) => (
                <TableRow 
                  key={cert.id} 
                  className="hover:bg-table-row-hover transition-colors"
                >
                  <TableCell className="font-medium">{cert.certificationName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
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
                  <TableCell className="text-right font-medium">€{cert.priceInEUR}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {cert.notes}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a href={cert.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
