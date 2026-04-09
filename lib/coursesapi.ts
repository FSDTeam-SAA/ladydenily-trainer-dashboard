// Updated coursesapi.ts file
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Types
export interface Course {
  _id: string
  name: string
  description: string
  photo?: string | null
  price: number
  offerPrice: number
  coordinator: Coordinator[]
  modules: Module[]
  enrolled: any[]
  createdAt?: string
  updatedAt?: string
  __v: number
}

export interface Coordinator {
  _id: string
  name: string
  email: string
  username: string
  phone: string
  role: string
  avatar: {
    public_id: string
    url: string
  }
}

export interface Module {
  _id: string
  name: string
  video: Video[]
  resources: Resource[]
  assignment: Assignment[]
  __v: number
}

export interface Video {
  name: string
  no: number
  url: string
  _id: string
}

export interface Resource {
  name: string
  url: string
  _id: string
}

export interface Assignment {
  title: string
  start: string
  submission: any[]
  _id: string
}

export interface CreateCourseData {
  name: string
  description: string
  price: number
  offerPrice: number
  coordinator: string[]
  modules: string[]
}

export interface CreateModuleData {
  name: string
  videoFiles?: File[]
  resourceFiles?: File[]
  videos?: {
    name: string
    no?: number
    url: string
    public_id?: string
  }[]
  resources?: {
    name: string
    url: string
    public_id?: string
  }[]
  assignment?: {
    title: string
    start: string
  }[]
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8001/api/v1"

// API Functions
export const courseApi = {
  // Get courses by trainer
  getCoursesByTrainer: async (token: string): Promise<{ success: boolean; data: Course[] }> => {
    const response = await fetch(`${API_BASE_URL}/course/courses/by-trainer`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) throw new Error("Failed to fetch courses")
    return response.json()
  },

  // Create course
  createCourse: async (data: FormData, token: string): Promise<any> => {
    console.log("[v0] Creating course with FormData entries:")
    for (const [key, value] of data.entries()) {
      console.log(`${key}: ${value}`)
    }

    const response = await fetch(`${API_BASE_URL}/course/courses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create course: ${errorData.message || response.statusText}`)
    }
    return response.json()
  },

  // Update course
  updateCourse: async (id: string, data: FormData, token: string): Promise<any> => {
    console.log("[v0] Updating course with FormData entries:")
    for (const [key, value] of data.entries()) {
      console.log(`${key}: ${value}`)
    }

    const response = await fetch(`${API_BASE_URL}/course/courses/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to update course: ${errorData.message || response.statusText}`)
    }
    return response.json()
  },

  // Delete course
  deleteCourse: async (id: string, token: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/course/courses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) throw new Error("Failed to delete course")
    return response.json()
  },
}

export const moduleApi = {
  createModule: async (data: FormData, token: string): Promise<any> => {
    console.log("[v0] Creating module with FormData entries:")
    for (const [key, value] of data.entries()) {
      console.log(`${key}: ${value}`)
    }

    const response = await fetch(`${API_BASE_URL}/course/modules`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create module: ${errorData.message || response.statusText}`)
    }

    return response.json()
  },

  // Update module
  updateModule: async (id: string, data: Partial<CreateModuleData>, token: string): Promise<any> => {
    const formData = new FormData()

    if (data.name !== undefined) formData.append("name", data.name)

    if (data.videoFiles) {
      data.videoFiles.forEach((file) => formData.append("video", file))
    }

    if (data.videos !== undefined) {
      formData.append("videos", JSON.stringify(data.videos))
    }

    if (data.resourceFiles) {
      data.resourceFiles.forEach((file) => formData.append("resources", file))
    }

    if (data.resources !== undefined) {
      formData.append("resources", JSON.stringify(data.resources))
    }

    if (data.assignment) {
      formData.append("assignment", JSON.stringify(data.assignment))
    }

    console.log("[v0] Updating module with FormData entries:")
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`)
    }

    const response = await fetch(`${API_BASE_URL}/course/modules/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to update module: ${errorData.message || response.statusText}`)
    }
    return response.json()
  },
}

export const trainerApi = {
  // Get all trainers
  getAllTrainers: async (token: string): Promise<{ success: boolean; data: Coordinator[] }> => {
    const response = await fetch(`${API_BASE_URL}/user/trainers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) throw new Error("Failed to fetch trainers")
    return response.json()
  },
}

// React Query Hooks
export const useCourses = (token?: string) => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: () => courseApi.getCoursesByTrainer(token!),
    enabled: !!token,
  })
}

export const useTrainers = (token?: string) => {
  return useQuery({
    queryKey: ["trainers"],
    queryFn: () => trainerApi.getAllTrainers(token!),
    enabled: !!token,
  })
}

export const useCreateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, token }: { data: FormData; token: string }) => {
      console.log("[v0] 📤 Creating course with FormData:")
      for (const [key, value] of data.entries()) {
        console.log(`${key}: ${value}`)
      }
      return courseApi.createCourse(data, token)
    },
    onSuccess: (response) => {
      console.log("[v0] ✅ Course created successfully:", response)
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error) => {
      console.error("[v0] ❌ Error creating course:", error)
    },
  })
}

export const useUpdateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data, token }: { id: string; data: FormData; token: string }) => {
      console.log("[v0] 📤 Updating course with FormData:")
      for (const [key, value] of data.entries()) {
        console.log(`${key}: ${value}`)
      }
      return courseApi.updateCourse(id, data, token)
    },
    onSuccess: () => {
      console.log("[v0] ✅ Course updated successfully")
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
    onError: (error) => {
      console.error("[v0] ❌ Error updating course:", error)
    },
  })
}

export const useDeleteCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, token }: { id: string; token: string }) => courseApi.deleteCourse(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export const useCreateModule = () => {
  return useMutation({
    mutationFn: ({ data, token }: { data: FormData; token: string }) => {
      console.log("[v0] 📤 Creating module with FormData:")
      for (const [key, value] of data.entries()) {
        console.log(`${key}: ${value}`)
      }
      return moduleApi.createModule(data, token)
    },
    onSuccess: (response) => {
      console.log("[v0] ✅ Module created successfully:", response)
    },
    onError: (error) => {
      console.error("[v0] ❌ Error creating module:", error)
    },
  })
}

export const useUpdateModule = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
      token,
    }: {
      id: string
      data: Partial<CreateModuleData>
      token: string
    }) => moduleApi.updateModule(id, data, token),
  })
}
