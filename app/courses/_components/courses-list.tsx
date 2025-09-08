"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { CoursePagination } from "@/components/course-pagination"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Coordinator {
  _id: string
  name: string
  email: string
  avatar?: {
    url: string
  }
}

interface Module {
  _id: string
  name: string
  video: any[]
  resources: any[]
  assignment: any[]
}

interface ApiCourse {
  _id: string
  name: string
  description: string
  photo: string | null
  price: number
  offerPrice: number
  coordinator: Coordinator[]
  modules: Module[]
  enrolled: any[]
}

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string | null
  trainers: { name: string; avatar: string }[]
  enroll: number
  modules: number
  deadline: string
  price: string
  added: string
}

const fetchCourses = async (token?: string): Promise<ApiCourse[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    throw new Error("API base URL not configured")
  }

  const response = await fetch(`${baseUrl}/course/all-courses`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch courses")
  }

  const data = await response.json()
  return data.data.course || []
}

const deleteCourse = async (courseId: string, token?: string): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) {
    throw new Error("API base URL not configured")
  }

  const response = await fetch(`${baseUrl}/course/courses/${courseId}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (!response.ok) {
    throw new Error("Failed to delete course")
  }
}

const transformApiCourse = (apiCourse: ApiCourse): Course => {
  return {
    id: apiCourse._id,
    title: apiCourse.name,
    description: apiCourse.description,
    thumbnail: apiCourse.photo,
    trainers: apiCourse.coordinator.map((coord) => ({
      name: coord.name,
      avatar: coord.avatar?.url || "/placeholder.svg",
    })),
    enroll: apiCourse.enrolled.length,
    modules: apiCourse.modules.length,
    deadline: "4 Weeks",
    price: apiCourse.offerPrice ? `$${apiCourse.offerPrice}` : `$${apiCourse.price}`,
    added: new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useSession()
  const token = session?.accessToken

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiCourses = await fetchCourses(token)
        const transformedCourses = apiCourses.map(transformApiCourse)
        setCourses(transformedCourses)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses")
        console.error("Error fetching courses:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [token])

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId, token)
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
    } catch (err) {
      console.error("Error deleting course:", err)
      setError(err instanceof Error ? err.message : "Failed to delete course")
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Courses</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Courses</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Trainer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Enroll</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Modules</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Deadline</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Added</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((course, index) => (
                  <tr key={course.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={course.thumbnail || "/placeholder.svg?height=48&width=64&query=course thumbnail"}
                            alt={course.title}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {course.trainers.map((trainer, trainerIndex) => (
                          <div key={trainerIndex} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={trainer.avatar || "/placeholder.svg"} alt={trainer.name} />
                              <AvatarFallback>
                                {trainer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {trainerIndex === 0 && <span className="text-sm text-foreground">{trainer.name}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-foreground">{course.enroll}</td>
                    <td className="p-4 text-foreground">{course.modules}</td>
                    <td className="p-4 text-foreground">{course.deadline}</td>
                    <td className="p-4 text-foreground">{course.price}</td>
                    <td className="p-4 text-muted-foreground">{course.added}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to {courses.length} of {courses.length} results
            </p>
            <CoursePagination />
          </div>
        </div>
      </div>
    </div>
  )
}