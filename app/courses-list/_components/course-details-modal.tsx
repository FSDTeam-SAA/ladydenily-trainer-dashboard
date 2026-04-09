"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Course } from "@/lib/coursesapi"
import { ClipboardList, ExternalLink, FileText } from "lucide-react"

interface CourseDetailsModalProps {
  course: Course | null
  isOpen: boolean
  onClose: () => void
}

const normalizePhotoSrc = (src?: string | null) => {
  if (!src) return "/placeholder.svg?height=200&width=300&query=course"
  const normalized = src.replace(/\\/g, "/")
  if (normalized.startsWith("http")) return normalized
  return `/${normalized.replace(/^\/+/, "")}`
}

export function CourseDetailsModal({ course, isOpen, onClose }: CourseDetailsModalProps) {
  if (!course) return null

  const description = getSafeText(course.description).replace(/<[^>]+>/g, "").trim() || "No description"
  const coordinators = Array.isArray(course.coordinator) ? course.coordinator : []
  const modules = Array.isArray(course.modules) ? course.modules : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{course.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Info */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border relative aspect-video">
              <img
                src={normalizePhotoSrc(course.photo)}
                alt={getSafeText(course.name, "Course photo")}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.svg?height=200&width=300&query=course"
                }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Coordinator</div>
              <div className="text-sm font-medium">
                {coordinators.length
                  ? coordinators.map((coord) => getSafeText(coord?.name, "Unknown trainer")).join(", ")
                  : "Unassigned"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pricing</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">{formatPrice(course.offerPrice || course.price)}</span>
                {hasOfferPrice(course.offerPrice, course.price) && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(course.price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-foreground leading-relaxed">{description}</p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Course Modules</h3>
                <Badge variant="secondary">{modules.length} Modules</Badge>
              </div>

              {modules.length ? (
                <div className="space-y-6">
                  {modules.map((module) => (
                    <div key={module._id} className="rounded-xl border bg-card p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-lg">{getSafeText(module.name, "Untitled module")}</div>
                        <div className="flex gap-3 text-xs font-medium">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            Videos: {Array.isArray(module.video) ? module.video.length : 0}
                          </span>
                          <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                            Files: {Array.isArray(module.resources) ? module.resources.length : 0}
                          </span>
                        </div>
                      </div>

                      {/* Videos Grid */}
                      {Array.isArray(module.video) && module.video.length ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {module.video.map((video) => (
                            <div key={video._id} className="group rounded-lg border p-3 hover:border-primary transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-primary uppercase">Video {video.no}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => window.open(video.url, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="aspect-video mb-2 overflow-hidden rounded bg-black">
                                <video controls preload="metadata" className="h-full w-full">
                                  <source src={video.url} />
                                </video>
                              </div>
                              <div className="text-sm font-medium truncate">{getSafeText(video.name, "Untitled video")}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Resources Section */}
                      {Array.isArray(module.resources) && module.resources.length ? (
                        <div className="mt-6 space-y-2">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <FileText className="h-3 w-3" /> Study Material
                          </h4>
                          {module.resources.map((res) => (
                            <button
                              key={res._id}
                              onClick={() => window.open(res.url, "_blank")}
                              className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <span className="truncate">{getSafeText(res.name, "Untitled resource")}</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {/* NEW: Assignments Section */}
                      {Array.isArray(module.assignment) && module.assignment.length > 0 ? (
                        <div className="mt-6 space-y-2">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <ClipboardList className="h-3 w-3" /> Assignments
                          </h4>
                          {module.assignment.map((assign: any) => (
                            <div key={assign._id} className="flex items-center justify-between rounded-md border border-dashed border-green-200 bg-green-50/30 px-3 py-2 text-sm">
                              <span>{getSafeText(assign?.title || assign?.name, "Unnamed Assignment")}</span>
                              <Badge variant="outline" className="text-[10px] bg-white">Action Required</Badge>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border rounded-xl border-dashed">
                  <p className="text-sm text-muted-foreground">No curriculum data found for this course.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getSafeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function formatPrice(value?: number | null) {
  const safeValue = Number(value)

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(safeValue) ? safeValue : 0)
}

function hasOfferPrice(offerPrice?: number | null, price?: number | null) {
  const safeOfferPrice = Number(offerPrice)
  const safePrice = Number(price)

  return Number.isFinite(safeOfferPrice) && Number.isFinite(safePrice) && safeOfferPrice > 0 && safeOfferPrice !== safePrice
}
