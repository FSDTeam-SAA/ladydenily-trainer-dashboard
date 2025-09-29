"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Course } from "@/lib/coursesapi"
import { CoursesList } from "./_components/allCoursesList"
import { CourseForm } from "./_components/course-form"

type ViewMode = "list" | "create" | "edit" | "modules"

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setViewMode("edit")
  }

  const handleCreateCourse = () => {
    setSelectedCourse(null)
    setViewMode("create")
  }

  const handleDeleteCourse = (courseId: string) => {
    console.log("Delete course:", courseId)
  }

  const handleSaveCourse = (course: any) => {
    console.log("Course saved:", course)
    setViewMode("list")
    setSelectedCourse(null)
  }

  const handleCancelForm = () => {
    setViewMode("list")
    setSelectedCourse(null)
  }

  const handleViewModules = () => {
    setViewMode("modules")
  }



  return (
    <div className="pt-16">
      <div className="py-8 px-4">
        {/* Navigation */}
        {viewMode !== "list" && (
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode("list")}>
              ← Back to Courses
            </Button>
          </div>
        )}

        

        {/* Content based on view mode */}
        {viewMode === "list" && (
          <CoursesList
            onEditCourse={handleEditCourse}
            onCreateCourse={handleCreateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        )}

        {viewMode === "create" && <CourseForm onSave={handleSaveCourse} onCancel={handleCancelForm} />}

        {viewMode === "edit" && selectedCourse && (
          <CourseForm course={selectedCourse} onSave={handleSaveCourse} onCancel={handleCancelForm} />
        )}

        
      </div>
    </div>
  )
}
