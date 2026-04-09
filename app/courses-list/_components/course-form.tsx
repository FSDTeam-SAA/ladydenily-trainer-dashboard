"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormItem, FormLabel, FormControl, FormField, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X, Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import { VideoUploader } from "./video-uploader"
import QuillEditor from "./QuillEditor"
import { useCreateCourse, useUpdateCourse } from "@/lib/coursesapi"
import { toast } from "@/hooks/use-toast"

interface UploadedFile {
  file: File
  url: string
  name: string
  type: string
  size: number
  s3Url?: string
}

interface Module {
  tempId: string
  name: string
  videos: UploadedFile[]
  resources: UploadedFile[]
  isCreated: boolean
  moduleId?: string
  creationFailed: boolean
}

interface CourseFormProps {
  course?: any
  onSave?: (course?: any) => void
  onCancel?: () => void
  variant?: "page" | "modal"
}

export function CourseForm({ course, onSave, onCancel, variant = "page" }: CourseFormProps) {
  const { data: session } = useSession()
  const createCourseMutation = useCreateCourse()
  const updateCourseMutation = useUpdateCourse()
  const isEditMode = Boolean(course)
  const [modules, setModules] = useState<Module[]>([
    {
      tempId: createTempId(),
      name: "",
      videos: [],
      resources: [],
      isCreated: false,
      creationFailed: false,
    },
  ])

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

  const form = useForm({
    defaultValues: {
      name: course?.name || "",
      description: course?.description || "",
      price: course?.price || "",
      offerPrice: course?.offerPrice || "",
      coordinator: course?.coordinator?.[0]?.name || "",
    },
  })

  useEffect(() => {
    form.reset({
      name: course?.name || "",
      description: course?.description || "",
      price: course?.price || "",
      offerPrice: course?.offerPrice || "",
      coordinator: course?.coordinator?.[0]?.name || "",
    })
    setPhotoFile(null)
    if (course?.photo) {
      const normalized = course.photo.replace(/\\/g, "/")
      const src = normalized.startsWith("http") ? normalized : `/${normalized.replace(/^\/+/, "")}`
      setPhotoPreview(src)
    } else {
      setPhotoPreview("")
    }
  }, [course, form])

  const updateModule = (index: number, key: keyof Module, value: any) => {
    const updatedModules = [...modules]
    updatedModules[index] = { ...updatedModules[index], [key]: value }
    setModules(updatedModules)
  }

  const addModule = () => {
    setModules([
      ...modules,
      {
        tempId: createTempId(),
        name: "",
        videos: [],
        resources: [],
        isCreated: false,
        creationFailed: false,
      },
    ])
  }

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: any) => {
    if (!session?.accessToken) {
      toast({
        title: "Sign in required",
        description: "Please sign in to continue.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("description", data.description || "")
    formData.append("price", data.price.toString())
    formData.append("offerPrice", data.offerPrice.toString())

    if (!isEditMode && session.user?.id) {
      formData.append("coordinator", JSON.stringify([session.user.id]))
    }

    if (photoFile) {
      formData.append("photo", photoFile)
    }

    if (!isEditMode) {
      // Prepare modules with S3 URLs
      const modulesData = modules.map((module) => ({
        name: module.name,
        videos: module.videos.map((v, index) => ({
          name: v.name,
          no: index + 1,
          url: v.s3Url,
        })),
        resources: module.resources.map((r) => ({
          name: r.name,
          url: r.s3Url,
        })),
      }))

      formData.append("modules", JSON.stringify(modulesData))
    }

    try {
      if (isEditMode && course?._id) {
        const response = await updateCourseMutation.mutateAsync({
          id: course._id,
          data: formData,
          token: session.accessToken,
        })
        onSave?.(response?.data ?? response)
        return
      }

      const response = await createCourseMutation.mutateAsync({
        data: formData,
        token: session.accessToken,
      })

      onSave?.(response?.data ?? response)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save course"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className={variant === "modal" ? "space-y-6 p-6 bg-gray-50" : "space-y-6 p-6 bg-gray-50 min-h-screen"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course ? "Edit Course" : "Create Course"}</h1>
          <p className="text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className={isEditMode ? "lg:col-span-3 space-y-6" : "lg:col-span-1 space-y-6"}>
                  {/* Course Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Courses Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Type courses name here ..." {...field} className="border-gray-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <QuillEditor
                            id="description"
                            value={field.value || ""}
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Photo Upload */}
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Photo</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {photoPreview ? (
                        <div className="space-y-3">
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="Course photo"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement("input")
                              input.type = "file"
                              input.accept = "image/*"
                              input.onchange = (e) => handlePhotoUpload(e as any)
                              input.click()
                            }}
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="w-12 h-12 mx-auto text-blue-500" />
                          <p className="text-sm text-gray-600">Upload your image.</p>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            onClick={() => {
                              const input = document.createElement("input")
                              input.type = "file"
                              input.accept = "image/*"
                              input.onchange = (e) => handlePhotoUpload(e as any)
                              input.click()
                            }}
                          >
                            Add Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormItem>

                  {/* Price Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Price</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">$</span>
                              <Input type="number" placeholder="0" {...field} className="border-gray-300" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offerPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Offer price (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">$</span>
                              <Input type="number" placeholder="0" {...field} className="border-gray-300" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Coordinator */}
                  <FormField
                    control={form.control}
                    name="coordinator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Coordinator</FormLabel>
                        <FormControl>
                          <Input placeholder="Type Coordinator name here ..." {...field} className="border-gray-300" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column - Modules */}
                {!isEditMode && (
                  <div className="lg:col-span-2 space-y-4">
                    {modules.map((module, moduleIndex) => (
                      <Card key={module.tempId} className="border-gray-300 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Module {moduleIndex + 1}</CardTitle>
                            {modules.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeModule(moduleIndex)}
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          {/* Module Name */}
                          <div>
                            <FormLabel className="text-sm font-medium">Module Name</FormLabel>
                            <Input
                              placeholder="Type modules name here ..."
                              value={module.name}
                              onChange={(e) => updateModule(moduleIndex, "name", e.target.value)}
                              className="border-gray-300"
                            />
                          </div>

                          {/* Video and Resources Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <VideoUploader
                                videos={module.videos}
                                onVideosChange={(videos) => updateModule(moduleIndex, "videos", videos)}
                                label="Video"
                                description="Upload your video."
                                buttonText="Add Video"
                                accept="video/*"
                                icon="upload"
                              />
                            </div>

                            <div>
                              <VideoUploader
                                videos={module.resources}
                                onVideosChange={(resources) => updateModule(moduleIndex, "resources", resources)}
                                label="Resources"
                                description="Upload your PDF file."
                                buttonText="Add PDF"
                                accept=".pdf,application/pdf"
                                icon="file"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add More Modules Button */}
                    <Button
                      type="button"
                      onClick={addModule}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add More Modules
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-gray-300 bg-transparent">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
            >
              {isEditMode
                ? updateCourseMutation.isPending
                  ? "Saving..."
                  : "Save Changes"
                : createCourseMutation.isPending
                  ? "Creating..."
                  : "Create Course"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function createTempId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `module-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
