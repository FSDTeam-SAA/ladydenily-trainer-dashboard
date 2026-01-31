"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Course } from "@/lib/coursesapi"
import { CoursesList } from "./_components/allCoursesList"
import { CourseForm } from "./_components/course-form"
import { CourseDetailsModal } from "./_components/course-details-modal"

export default function HomePage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsEditOpen(true)
  }

  const handleCreateCourse = () => {
    setSelectedCourse(null)
    setIsCreateOpen(true)
  }

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsDetailsOpen(true)
  }

  const handleDeleteCourse = (courseId: string) => {
    console.log("Delete course:", courseId)
  }

  const handleSaveCourse = (course: any) => {
    console.log("Course saved:", course)
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setSelectedCourse(null)
  }

  const handleCancelForm = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setSelectedCourse(null)
  }

  return (
    <div className="pt-16">
      <div className="py-8 px-4">
        <CoursesList
          onEditCourse={handleEditCourse}
          onCreateCourse={handleCreateCourse}
          onViewCourse={handleViewCourse}
          onDeleteCourse={handleDeleteCourse}
        />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <CourseForm onSave={handleSaveCourse} onCancel={handleCancelForm} variant="modal" />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            {selectedCourse && (
              <CourseForm course={selectedCourse} onSave={handleSaveCourse} onCancel={handleCancelForm} variant="modal" />
            )}
          </DialogContent>
        </Dialog>

        <CourseDetailsModal course={selectedCourse} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
      </div>
    </div>
  )
}
