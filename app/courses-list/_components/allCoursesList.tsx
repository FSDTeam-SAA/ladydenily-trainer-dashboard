"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useCourses, useDeleteCourse } from "@/lib/coursesapi"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Eye, Trash2, Search, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Course } from "@/lib/coursesapi"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"

interface CoursesListProps {
  onEditCourse?: (course: Course) => void
  onCreateCourse?: () => void
  onViewCourse?: (course: Course) => void
  onDeleteCourse?: (courseId: string) => void
}

export function CoursesList({ onEditCourse, onCreateCourse, onViewCourse, onDeleteCourse }: CoursesListProps) {
  const { data: session } = useSession()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    course: Course | null
  }>({
    isOpen: false,
    course: null,
  })
  const itemsPerPage = 7

  const { data: coursesResponse, isLoading, error } = useCourses(session?.accessToken)
  const deleteCourseMutation = useDeleteCourse()

  const courses = useMemo(() => {
    const responseData = coursesResponse?.data

    if (Array.isArray(responseData)) {
      return responseData
    }

    if (
      responseData &&
      typeof responseData === "object" &&
      "course" in responseData &&
      Array.isArray(responseData.course)
    ) {
      return responseData.course
    }

    return []
  }, [coursesResponse])

  const searchValue = searchTerm.trim().toLowerCase()

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchValue) return courses

    return courses.filter((course) => {
      const courseName = getCourseName(course).toLowerCase()
      const description = getCourseDescription(course).toLowerCase()
      const coordinatorMatch = Array.isArray(course.coordinator)
        ? course.coordinator.some((coord) => getSafeText(coord?.name).toLowerCase().includes(searchValue))
        : false

      return (
        courseName.includes(searchValue) ||
        description.includes(searchValue) ||
        coordinatorMatch
      )
    })
  }, [courses, searchValue])

  // Pagination logic
  const totalPages = Math.max(Math.ceil(filteredCourses.length / itemsPerPage), 1)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    const lastPage = Math.max(totalPages, 1)

    if (currentPage > lastPage) {
      setCurrentPage(lastPage)
    }
  }, [currentPage, totalPages])

  const handleDeleteClick = (course: Course) => {
    setDeleteModal({
      isOpen: true,
      course,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!session?.accessToken || !deleteModal.course) return

    try {
      await deleteCourseMutation.mutateAsync({
        id: deleteModal.course._id,
        token: session.accessToken,
      })

      toast({
        title: "Success",
        description: "Course deleted successfully",
      })

      onDeleteCourse?.(deleteModal.course._id)
      setDeleteModal({ isOpen: false, course: null })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
      console.error("Failed to delete course:", error)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, course: null })
  }

  const formatPrice = (price?: number | null) => {
    const safePrice = Number(price)

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number.isFinite(safePrice) ? safePrice : 0)
  }

  const normalizePhotoSrc = (src?: string | null) => {
    if (!src) return "/placeholder.svg?height=48&width=48&query=course"
    const normalized = src.replace(/\\/g, "/")
    if (normalized.startsWith("http")) return normalized
    return `/${normalized.replace(/^\/+/, "")}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading courses...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-destructive">Failed to load courses</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
        <Button onClick={onCreateCourse} className="bg-yellow-500 hover:bg-yellow-600 text-black">
          <Plus className="w-4 h-4 mr-2" />
          Create Courses
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1) // Reset to first page when searching
          }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Courses</TableHead>
              <TableHead>Enroll</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? "No courses found matching your search." : "No courses available."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCourses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <img
                          src={normalizePhotoSrc(course.photo)}
                          alt={getCourseName(course)}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/placeholder.svg?height=48&width=48&query=course"
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{getCourseName(course)}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {getCourseDescription(course)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{Array.isArray(course.enrolled) ? course.enrolled.length : 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{Array.isArray(course.modules) ? course.modules.length : 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getCourseDeadline(course)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{formatPrice(getDisplayPrice(course))}</div>
                      {hasOfferPrice(course) && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(course.price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(course.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onViewCourse?.(course)} className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEditCourse?.(course)} className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(course)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredCourses.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCourses.length)} of{" "}
            {filteredCourses.length} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page)
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        description="Are you sure you want to delete this course? This action cannot be undone and will permanently remove all associated data including modules, videos, and resources."
        itemName={deleteModal.course?.name}
        isLoading={deleteCourseMutation.isPending}
      />
    </div>
  )
}

function getSafeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function stripHtml(value: unknown) {
  return getSafeText(value).replace(/<[^>]+>/g, "").trim()
}

function getCourseName(course: Course) {
  return getSafeText(course?.name, "Untitled course")
}

function getCourseDescription(course: Course) {
  const description = stripHtml(course?.description)
  return description || "No description"
}

function getCourseDeadline(course: Course) {
  const firstAssignmentStart = Array.isArray(course.modules)
    ? course.modules.find((module) => Array.isArray(module.assignment) && module.assignment.length > 0)?.assignment?.[0]?.start
    : ""

  return formatDate(firstAssignmentStart, "4 Weeks")
}

function getDisplayPrice(course: Course) {
  const offerPrice = Number(course.offerPrice)
  const price = Number(course.price)

  if (Number.isFinite(offerPrice) && offerPrice > 0) {
    return offerPrice
  }

  return Number.isFinite(price) ? price : 0
}

function hasOfferPrice(course: Course) {
  const offerPrice = Number(course.offerPrice)
  const price = Number(course.price)

  return Number.isFinite(offerPrice) && Number.isFinite(price) && offerPrice > 0 && offerPrice !== price
}

function formatDate(value?: string, fallback = "N/A") {
  if (!value) {
    return fallback
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
