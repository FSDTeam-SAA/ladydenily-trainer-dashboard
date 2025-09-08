"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { studentsAPI, type User } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { UserPagination } from "@/components/user-pagination"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"

export default function UserPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  })

  const queryClient = useQueryClient()

  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students", currentPage],
    queryFn: () => studentsAPI.getStudents(currentPage, 10),
  })

  const deleteUserMutation = useMutation({
    mutationFn: studentsAPI.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] })
      toast.success("User deleted successfully")
      setDeleteModal({ isOpen: false, user: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user")
    },
  })

  const handleDeleteUser = (user: User) => {
    setDeleteModal({ isOpen: true, user })
  }

  const confirmDelete = () => {
    if (deleteModal.user) {
      deleteUserMutation.mutate(deleteModal.user._id)
    }
  }

  const users = usersData?.data?.students || []
  const meta = usersData?.data?.meta

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-center text-red-500">Failed to load users. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Students</h1>
        <p className="text-sm text-muted-foreground">Dashboard &gt; students</p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Experience</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-8" />
                      </td>
                    </tr>
                  ))
                : users.map((user, index) => (
                    <tr key={user._id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar?.url || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{user.name}</span>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4 text-foreground">{user.phone}</td>
                      <td className="p-4 text-foreground">{user.treding_profile?.trading_exprience || "N/A"}</td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {meta
                ? `Showing ${(currentPage - 1) * 10 + 1} to ${Math.min(currentPage * 10, meta.total)} of ${meta.total} results`
                : "Loading..."}
            </p>
            {meta && (
              <UserPagination currentPage={currentPage} totalPages={meta.totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteModal.user?.name}? This action cannot be undone.`}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  )
}
