import axios, { type AxiosResponse } from "axios"
import { getSession } from "next-auth/react"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  },
)

// Types
export interface User {
  _id: string
  name: string
  email: string
  username: string
  phone: string
  role: "admin" | "trainer" | "student"
  avatar: {
    public_id: string
    url: string
  }
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  userRating: {
    competence: { star: number; comment: string }
    punctuality: { star: number; comment: string }
    behavior: { star: number; comment: string }
  }
  treding_profile: {
    trading_exprience: string
    assets_of_interest: string
    main_goal: string
    risk_appetite: string
    preffered_learning: string[]
  }
  uniqueId: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    role: string
    _id: string
    user: User
  }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: {
    [key: string]: T[]
    meta: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface CreateTrainerData {
  name: string
  email: string
  password: string
  phone: string
  username: string
  address: {
    city: string
    state: string
    street: string
    zipCode: string
  }
  treding_profile: {
    trading_exprience: string
    assets_of_interest: string
    main_goal: string
    risk_appetite: string
    preffered_learning: string[]
  }
}

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post("/auth/login", {
      email,
      password,
    })
    return response.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post("/auth/forget-password", {
      email,
    })
    return response.data
  },

  resetPassword: async (email: string, otp: string, password: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post("/auth/reset-password", {
      email,
      otp,
      password,
    })
    return response.data
  },
}

// Trainers API
export const trainersAPI = {
  getTrainers: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    const response: AxiosResponse<PaginatedResponse<User>> = await apiClient.get(
      `/user/trainers?page=${page}&limit=${limit}`,
    )
    return response.data
  },

  addTrainer: async (data: CreateTrainerData): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.post("/user/add-trainer", data)
    return response.data
  },

  deleteTrainer: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.delete(`/user/trainers/${id}`)
    return response.data
  },
}

// Students API
export const studentsAPI = {
  getStudents: async (page = 1, limit = 10): Promise<PaginatedResponse<User>> => {
    const response: AxiosResponse<PaginatedResponse<User>> = await apiClient.get(
      `/user/students?page=${page}&limit=${limit}`,
    )
    return response.data
  },

  deleteStudent: async (id: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.delete(`/user/students/${id}`)
    return response.data
  },
}

// Legacy offer API (keeping existing functionality)
export interface Offer {
  _id: string
  course: Array<{
    _id: string
    name: string
    description: string
    price: number
    offerPrice: number
  }>
  offerPrice: number
  startDate: string
  endDate: string
  banner: {
    public_id: string
    url: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateOfferData {
  course: string[]
  offerPrice: number
  startDate: string
  endDate: string
  banner?: File
}

export const offerAPI = {
  // Get all offers
  getOffers: async (): Promise<{ success: boolean; data: Offer[] }> => {
    const response = await apiClient.get("/offer/get")
    return response.data
  },

  // Get single offer
  getOffer: async (id: string): Promise<{ success: boolean; data: Offer }> => {
    const response = await apiClient.get(`/offer/${id}`)
    return response.data
  },

  // Create offer
  createOffer: async (data: CreateOfferData): Promise<{ success: boolean; data: Offer }> => {
    const formData = new FormData()
    formData.append("course", JSON.stringify(data.course))
    formData.append("offerPrice", data.offerPrice.toString())
    formData.append("startDate", data.startDate)
    formData.append("endDate", data.endDate)
    if (data.banner) {
      formData.append("banner", data.banner)
    }

    const response = await apiClient.post("/offer/create", formData)
    return response.data
  },

  // Update offer
  updateOffer: async (id: string, data: Partial<CreateOfferData>): Promise<{ success: boolean; data: Offer }> => {
    const formData = new FormData()
    if (data.course) formData.append("course", JSON.stringify(data.course))
    if (data.offerPrice) formData.append("offerPrice", data.offerPrice.toString())
    if (data.startDate) formData.append("startDate", data.startDate)
    if (data.endDate) formData.append("endDate", data.endDate)
    if (data.banner) formData.append("banner", data.banner)

    const response = await apiClient.patch(`/offer/${id}`, formData)
    return response.data
  },

  // Delete offer
  deleteOffer: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/offer/${id}`)
    return response.data
  },
}
