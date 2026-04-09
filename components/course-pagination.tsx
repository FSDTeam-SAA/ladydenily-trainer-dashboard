"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CoursePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CoursePagination({ currentPage, totalPages, onPageChange }: CoursePaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages)

  const getVisiblePages = () => {
    const pages: Array<number | "..."> = []
    const maxVisible = 5

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i)
      }
    } else if (safeCurrentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i)
      }
      pages.push("...")
      pages.push(safeTotalPages)
    } else if (safeCurrentPage >= safeTotalPages - 2) {
      pages.push(1)
      pages.push("...")
      for (let i = safeTotalPages - 3; i <= safeTotalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) {
        pages.push(i)
      }
      pages.push("...")
      pages.push(safeTotalPages)
    }

    return pages
  }

  if (safeTotalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 1}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getVisiblePages().map((page, index) => (
        <div key={index}>
          {page === "..." ? (
            <span className="px-3 py-2 text-muted-foreground">...</span>
          ) : (
            <Button
              size="sm"
              variant={safeCurrentPage === page ? "default" : "ghost"}
              onClick={() => onPageChange(page)}
              className={
                safeCurrentPage === page
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            >
              {page}
            </Button>
          )}
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage === safeTotalPages}
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
