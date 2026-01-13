'use client';

import { useState, useMemo } from 'react';
import { Case } from '@/types/cases';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarrantApprovalTableProps {
  data: Case[];
  formatDate: (dateStr: string) => string;
}

function getWarrantStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return (
        <Badge
          variant="outline"
          className="border-0 bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
        >
          Approved
        </Badge>
      );
    case 'executed':
      return (
        <Badge
          variant="outline"
          className="border-0 bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          Executed
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge
          variant="outline"
          className="border-0 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          Pending
        </Badge>
      );
    case 'rejected':
      return (
        <Badge
          variant="outline"
          className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        >
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-0">
          Unknown
        </Badge>
      );
  }
}

export default function WarrantApprovalTable({
  data,
  formatDate,
}: WarrantApprovalTableProps) {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, data]);

  const pageCount = Math.ceil(data.length / itemsPerPage);
  const totalPages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pageCount));
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Recent Warrant Actions
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage approved warrant requests and actions
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted">
              <TableHead className="h-12 px-4 font-medium">Case ID</TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Case Title
              </TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Requested By
              </TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Approved By
              </TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Approval Date
              </TableHead>
              <TableHead className="h-12 px-4 font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((caseItem) => {
                const reqBy = caseItem.warrantRequestedBy
                  ? {
                      id: caseItem.warrantRequestedBy,
                      name: `Officer ${caseItem.warrantRequestedBy}`,
                    }
                  : null;
                const appBy = caseItem.warrantApprovedBy
                  ? {
                      id: caseItem.warrantApprovedBy,
                      name: `Officer ${caseItem.warrantApprovedBy}`,
                    }
                  : null;

                return (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50">
                    <TableCell className="h-14 px-4 font-mono text-sm font-medium">
                      {caseItem.id}
                    </TableCell>
                    <TableCell className="h-14 px-4 font-medium">
                      {caseItem.title}
                    </TableCell>
                    <TableCell className="h-14 px-4 text-sm text-muted-foreground">
                      {reqBy?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="h-14 px-4 text-sm text-muted-foreground">
                      {appBy?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="h-14 px-4 text-sm text-muted-foreground">
                      {caseItem.warrantApprovalDate
                        ? formatDate(caseItem.warrantApprovalDate)
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="h-14 px-4">
                      {getWarrantStatusBadge(caseItem.warrantStatus)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No approved warrants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          {paginatedData.length > 0
            ? (currentPage - 1) * itemsPerPage + 1
            : 0}{" "}
          to {(currentPage - 1) * itemsPerPage + paginatedData.length} of{" "}
          {data.length} entries
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          {totalPages.length > 0 &&
            totalPages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextPage}
            disabled={currentPage === pageCount || pageCount === 0}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
