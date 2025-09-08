"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Calendar } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Course {
  _id: string
  name: string
}

export default function OfferPage() {
  const [formData, setFormData] = useState({
    courses: "",
    offer: "",
    startDate: "",
    endDate: "",
  })
  const [coursesList, setCoursesList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: session } = useSession()
  const token = session?.accessToken

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL
        if (!baseUrl) {
          throw new Error("API base URL not configured")
        }
        const response = await fetch(`${baseUrl}/course/all-courses/`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }
        const data = await response.json()
        setCoursesList(data.data.course || [])
        toast.success("Courses loaded successfully")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load courses"
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [token])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file")
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB")
        return
      }
      
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      toast.success("Image selected successfully")
    }
  }

  const handleSave = async () => {
    if (!imageFile) {
      toast.error("Please select an image for the offer banner")
      return
    }

    if (!formData.courses || !formData.offer || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setUploading(true)
      setError(null)
      
      toast.loading("Creating offer...")

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL
      if (!baseUrl) {
        throw new Error("API base URL not configured")
      }

      // Create FormData for the offer with image
      const formDataToSend = new FormData()
      formDataToSend.append("course", formData.courses)
      formDataToSend.append("offerPrice", formData.offer)
      formDataToSend.append("startDate", new Date(formData.startDate).toISOString())
      formDataToSend.append("endDate", new Date(formData.endDate).toISOString())
      formDataToSend.append("banner", imageFile)

      const response = await fetch(`${baseUrl}/offer/create`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create offer")
      }

      const data = await response.json()
      console.log("Offer created successfully:", data)
      
      // Reset form after successful creation
      setFormData({
        courses: "",
        offer: "",
        startDate: "",
        endDate: "",
      })
      setImageFile(null)
      setImagePreview(null)
      
      toast.success("Offer created successfully!")
      
      // Show success details
      toast.info(`Offer for ${formData.offer}% discount has been created`, {
        description: `Valid from ${new Date(formData.startDate).toLocaleDateString()} to ${new Date(formData.endDate).toLocaleDateString()}`,
        duration: 5000,
      })

    } catch (err) {
      console.error("Error creating offer:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create offer"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Offer</h1>
            <p className="text-sm text-muted-foreground">Dashboard &gt; Offer</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error && !uploading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Offer</h1>
            <p className="text-sm text-muted-foreground">Dashboard &gt; Offer</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Offer</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Offer</p>
        </div>
        <Button 
          onClick={handleSave} 
          className="bg-[#F1C40F] hover:bg-[#F39C12] text-black"
          disabled={uploading}
        >
          {uploading ? "Creating..." : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label htmlFor="courses" className="text-sm font-medium text-gray-700 mb-2 block">
              What courses are offered?
            </Label>
            <select
              id="courses"
              value={formData.courses}
              onChange={(e) => handleInputChange("courses", e.target.value)}
              className="w-full bg-gray-100 border-gray-200 p-2 rounded"
              required
            >
              <option value="">Select a course</option>
              {coursesList.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="offer" className="text-sm font-medium text-gray-700 mb-2 block">
              Offer (%)
            </Label>
            <Input
              id="offer"
              type="number"
              placeholder="Enter percentage"
              value={formData.offer}
              onChange={(e) => handleInputChange("offer", e.target.value)}
              className="bg-gray-100 border-gray-200"
              required
              min="1"
              max="100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-2 block">
                Start Date
              </Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="bg-gray-100 border-gray-200 pr-10"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-2 block">
                End Date
              </Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="bg-gray-100 border-gray-200 pr-10"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Offer Banner *</Label>
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Offer Banner Preview"
                  className="max-w-full max-h-48 mb-4 object-contain rounded"
                />
              ) : (
                <>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Upload your Image.</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
                required
              />
              <Button
                onClick={() => document.getElementById("imageUpload")?.click()}
                className="bg-[#F1C40F] hover:bg-[#F39C12] text-black border-[#F1C40F]"
                disabled={uploading}
              >
                Select Image
              </Button>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-2">* Banner image is required (max 5MB)</p>
        </div>
      </div>
    </div>
  )
}