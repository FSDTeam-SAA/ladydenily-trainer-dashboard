"use client"

import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CoursesListError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">Courses page failed to load</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong while rendering the trainer courses list. Try loading the page again.
        </p>
        {error?.message ? (
          <p className="mt-4 break-words rounded-md bg-muted px-4 py-3 text-left text-sm text-muted-foreground">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex justify-center">
          <Button type="button" onClick={reset} className="bg-yellow-500 text-black hover:bg-yellow-600">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
