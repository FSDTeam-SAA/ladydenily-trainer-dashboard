"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { trainersAPI, type User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Star } from "lucide-react"
import { toast } from "sonner"
import { AddTrainerModal } from "@/components/add-trainer-modal"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { TrainerPagination } from "@/components/trainer-pagination"

export default function TrainersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; trainer: User | null }>({
    isOpen: false,
    trainer: null,
  })

  const queryClient = useQueryClient()

  // Fetch trainers with pagination
  const {
    data: trainersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trainers", currentPage],
    queryFn: () => trainersAPI.getTrainers(currentPage, 10),
  })

  // Delete trainer mutation
  const deleteTrainerMutation = useMutation({
    mutationFn: trainersAPI.deleteTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      toast.success("Trainer deleted successfully")
      setDeleteModal({ isOpen: false, trainer: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete trainer")
    },
  })

  const handleDeleteTrainer = (trainer: User) => {
    setDeleteModal({ isOpen: true, trainer })
  }

  const confirmDelete = () => {
    if (deleteModal.trainer) {
      deleteTrainerMutation.mutate(deleteModal.trainer._id)
    }
  }

  const trainers = trainersData?.data?.trainers || []
  const meta = trainersData?.data?.meta

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Failed to load trainers. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trainers Management</h1>
          <p className="text-muted-foreground">Manage your trading academy trainers</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Trainer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TrainersSkeleton />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trainer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainers.map((trainer) => (
                    <TableRow key={trainer._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={trainer.avatar?.url || "/placeholder.svg"} />
                            <AvatarFallback>{trainer.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{trainer.name}</p>
                            <p className="text-sm text-muted-foreground">@{trainer.username}</p>
                            <Badge variant="secondary" className="text-xs">
                              ID: {trainer.uniqueId}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{trainer.email}</p>
                          <p className="text-sm text-muted-foreground">{trainer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trainer.treding_profile?.trading_exprience || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {(
                              (trainer.userRating?.competence?.star +
                                trainer.userRating?.punctuality?.star +
                                trainer.userRating?.behavior?.star) /
                              3
                            ).toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {trainer.address?.city}, {trainer.address?.state}
                          </p>
                          <p className="text-muted-foreground">{trainer.address?.zipCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTrainer(trainer)}
                          disabled={deleteTrainerMutation.isPending}
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
                  <TrainerPagination
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

      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["trainers"] })
          setIsAddModalOpen(false)
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, trainer: null })}
        onConfirm={confirmDelete}
        title="Delete Trainer"
        description={`Are you sure you want to delete ${deleteModal.trainer?.name}? This action cannot be undone.`}
        isLoading={deleteTrainerMutation.isPending}
      />
    </div>
  )
}

function TrainersSkeleton() {
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
