"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { studentsAPI, type User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Star } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { StudentPagination } from "@/components/student-pagination"

export default function StudentsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; student: User | null }>({
    isOpen: false,
    student: null,
  })

  const queryClient = useQueryClient()

  // Fetch students with pagination
  const {
    data: studentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students", currentPage],
    queryFn: () => studentsAPI.getStudents(currentPage, 10),
  })

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: studentsAPI.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("Student deleted successfully")
      setDeleteModal({ isOpen: false, student: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete student")
    },
  })

  const handleDeleteStudent = (student: User) => {
    setDeleteModal({ isOpen: true, student })
  }

  const confirmDelete = () => {
    if (deleteModal.student) {
      deleteStudentMutation.mutate(deleteModal.student._id)
    }
  }

  const students = studentsData?.data?.students || []
  const meta = studentsData?.data?.meta

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Failed to load students. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">Manage your trading academy students</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StudentsSkeleton />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.avatar?.url || "/placeholder.svg"} />
                            <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">@{student.username}</p>
                            <Badge variant="secondary" className="text-xs">
                              ID: {student.uniqueId}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.treding_profile?.trading_exprience || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {(
                              (student.userRating?.competence?.star +
                                student.userRating?.punctuality?.star +
                                student.userRating?.behavior?.star) /
                              3
                            ).toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {student.address?.city}, {student.address?.state}
                          </p>
                          <p className="text-muted-foreground">{student.address?.zipCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta && (
                <div className="mt-6">
                  <StudentPagination
                    currentPage={currentPage}
                    totalPages={meta.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, student: null })}
        onConfirm={confirmDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteModal.student?.name}? This action cannot be undone.`}
        isLoading={deleteStudentMutation.isPending}
      />
    </div>
  )
}

function StudentsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[40px]" />
        </div>
      ))}
    </div>
  )
}
