"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

export function UserPagination() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
        1
      </Button>

      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
        2
      </Button>

      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
        3
      </Button>

      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
        17
      </Button>

      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
