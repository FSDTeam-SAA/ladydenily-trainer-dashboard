"use client"

import { useState, useMemo } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, Search, Plus } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import type { Course } from "@/lib/api"
import { DeleteConfirmationModal } from "./delete-confirmation-modal"
import Image from "next/image"

interface CoursesListProps {
  onEditCourse?: (course: Course) => void
  onCreateCourse?: () => void
  onDeleteCourse?: (courseId: string) => void
}

export function CoursesList({ onEditCourse, onCreateCourse, onDeleteCourse }: CoursesListProps) {
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

  const courses = coursesResponse?.data || []

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.coordinator.some((coord) => coord.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [courses, searchTerm])

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
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
                      <div>
                        <Image
                          src={course.photo || "/placeholder.svg?height=48&width=48&query=course"}
                          alt={course.name}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{course.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{course.enrolled?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.modules?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">4 Weeks</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{formatPrice(course.price)}</div>
                      {course.offerPrice !== course.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(course.offerPrice)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{format(new Date(), "dd MMM, yyyy")}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCourses.length)} of{" "}
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
