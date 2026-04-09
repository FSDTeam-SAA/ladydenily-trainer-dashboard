"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormItem, FormLabel, FormControl, FormField, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExternalLink, File, FileAudio, FileSpreadsheet, FileText, Plus, Upload, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { VideoUploader } from "./video-uploader"
import QuillEditor from "./QuillEditor"
import { useCreateCourse, useCreateModule, useUpdateCourse, useUpdateModule } from "@/lib/coursesapi"
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

interface ExistingModuleAsset {
  _id?: string
  name: string
  url: string
}

interface ExistingModuleAssignment {
  _id?: string
  title: string
}

interface ExistingModule {
  _id: string
  name: string
  video: ExistingModuleAsset[]
  resources: ExistingModuleAsset[]
  assignment: ExistingModuleAssignment[]
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
  const createModuleMutation = useCreateModule()
  const updateModuleMutation = useUpdateModule()
  const updateCourseMutation = useUpdateCourse()
  const isEditMode = Boolean(course)
  const [modules, setModules] = useState<Module[]>(() => (course ? [] : [createEmptyModule()]))
  const [existingModules, setExistingModules] = useState<ExistingModule[]>([])

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
    setExistingModules(getExistingModules(course))
    setModules(course ? [] : [createEmptyModule()])
  }, [course, form])

  const updateModule = (index: number, key: keyof Module, value: any) => {
    const updatedModules = [...modules]
    updatedModules[index] = { ...updatedModules[index], [key]: value }
    setModules(updatedModules)
  }

  const addModule = () => {
    setModules([
      ...modules,
      createEmptyModule(),
    ])
  }

  const removeModule = (index: number) => {
    if (isEditMode || modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index))
    }
  }

  const updateExistingModule = (moduleId: string, updater: (module: ExistingModule) => ExistingModule) => {
    setExistingModules((currentModules) =>
      currentModules.map((module) => (module._id === moduleId ? updater(module) : module)),
    )
  }

  const removeExistingModule = (moduleId: string) => {
    setExistingModules((currentModules) => currentModules.filter((module) => module._id !== moduleId))
  }

  const removeExistingModuleVideo = (moduleId: string, videoIndex: number) => {
    updateExistingModule(moduleId, (module) => ({
      ...module,
      video: module.video.filter((_, index) => index !== videoIndex),
    }))
  }

  const removeExistingModuleResource = (moduleId: string, resourceIndex: number) => {
    updateExistingModule(moduleId, (module) => ({
      ...module,
      resources: module.resources.filter((_, index) => index !== resourceIndex),
    }))
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
      const modulesData = modules.filter(hasModuleContent).map((module) => buildModulePayload(module))

      formData.append("modules", JSON.stringify(modulesData))
    }

    try {
      if (isEditMode && course?._id) {
        for (const module of existingModules) {
          await updateModuleMutation.mutateAsync({
            id: module._id,
            data: {
              name: module.name,
              videos: module.video.map((video, index) => ({
                name: video.name,
                no: index + 1,
                url: video.url,
              })),
              resources: module.resources.map((resource) => ({
                name: resource.name,
                url: resource.url,
              })),
            },
            token: session.accessToken,
          })
        }

        const existingModuleIds = existingModules.map((module) => module._id).filter(Boolean)
        const newModules = modules.filter(hasModuleContent)
        const createdModuleIds: string[] = []

        for (const module of newModules) {
          if (!module.name.trim()) {
            throw new Error("Module name is required for each added module")
          }

          const modulePayload = buildModulePayload(module)
          const moduleFormData = new FormData()

          moduleFormData.append("name", modulePayload.name)
          moduleFormData.append("videos", JSON.stringify(modulePayload.videos))
          moduleFormData.append("resources", JSON.stringify(modulePayload.resources))

          const createdModuleResponse = await createModuleMutation.mutateAsync({
            data: moduleFormData,
            token: session.accessToken,
          })

          const createdModuleId =
            createdModuleResponse?.data?._id ||
            createdModuleResponse?.data?.id ||
            createdModuleResponse?.data

          if (!createdModuleId) {
            throw new Error("Failed to create module")
          }

          createdModuleIds.push(createdModuleId)
        }

        formData.append("modules", JSON.stringify([...existingModuleIds, ...createdModuleIds]))

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
                <div className="lg:col-span-1 space-y-6">
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
                <div className="lg:col-span-2 space-y-4">
                  {isEditMode && (
                    <>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Modules</h2>
                        <p className="text-sm text-muted-foreground">Existing course modules</p>
                      </div>

                      {existingModules.length > 0 ? (
                        existingModules.map((module, moduleIndex) => (
                          <Card key={module._id || moduleIndex} className="border-gray-300 shadow-sm">
                            <CardHeader className="pb-3 border-b border-gray-200">
                              <div className="flex items-center justify-between gap-4">
                                <CardTitle className="text-base">Module {moduleIndex + 1}</CardTitle>
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-muted-foreground">
                                    Videos: {module.video.length} | Resources: {module.resources.length} | Assignments: {module.assignment.length}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeExistingModule(module._id)}
                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                              <div>
                                <FormLabel className="text-sm font-medium">Module Name</FormLabel>
                                <Input
                                  value={module.name}
                                  onChange={(event) =>
                                    updateExistingModule(module._id, (currentModule) => ({
                                      ...currentModule,
                                      name: event.target.value,
                                    }))
                                  }
                                  className="border-gray-300"
                                />
                              </div>

                              {module.video.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-sm font-medium text-foreground">Videos</p>
                                  {module.video.map((video, videoIndex) => (
                                    <div key={video._id || `${moduleIndex}-video-${videoIndex}`} className="space-y-3 rounded-lg border border-gray-200 bg-blue-50/40 p-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-gray-900">{video.name || `Video ${videoIndex + 1}`}</p>
                                          <p className="truncate text-xs text-gray-500">{video.url}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button type="button" variant="outline" size="sm" asChild>
                                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                                              Open
                                              <ExternalLink className="ml-2 h-3 w-3" />
                                            </a>
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeExistingModuleVideo(module._id, videoIndex)}
                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <video controls preload="metadata" className="w-full rounded-lg border bg-black/5">
                                        <source src={video.url} type={getVideoMimeType(video.url)} />
                                        Your browser does not support the video tag.
                                      </video>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {module.resources.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-foreground">Resources</p>
                                  <div className="space-y-2">
                                    {module.resources.map((resource, resourceIndex) => (
                                      <div key={resource._id || `${moduleIndex}-resource-${resourceIndex}`}>
                                        {renderExistingResourcePreview(
                                          resource,
                                          () => removeExistingModuleResource(module._id, resourceIndex),
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {module.assignment.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-foreground">Assignments</p>
                                  <div className="space-y-2">
                                    {module.assignment.map((assignment, assignmentIndex) => (
                                      <div
                                        key={assignment._id || `${moduleIndex}-assignment-${assignmentIndex}`}
                                        className="rounded-lg border border-dashed border-gray-300 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
                                      >
                                        {assignment.title || `Assignment ${assignmentIndex + 1}`}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                          No modules found for this course.
                        </div>
                      )}

                      <div className="pt-2">
                        <h3 className="text-lg font-semibold text-foreground">Add New Modules</h3>
                        <p className="text-sm text-muted-foreground">Upload more videos and resources for this course</p>
                      </div>
                    </>
                  )}

                  {modules.map((module, moduleIndex) => (
                    <Card key={module.tempId} className="border-gray-300 shadow-sm">
                      <CardHeader className="pb-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {isEditMode ? `New Module ${moduleIndex + 1}` : `Module ${moduleIndex + 1}`}
                          </CardTitle>
                          {(isEditMode || modules.length > 1) && (
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
                        <div>
                          <FormLabel className="text-sm font-medium">Module Name</FormLabel>
                          <Input
                            placeholder="Type modules name here ..."
                            value={module.name}
                            onChange={(e) => updateModule(moduleIndex, "name", e.target.value)}
                            className="border-gray-300"
                          />
                        </div>

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

                  <Button
                    type="button"
                    onClick={addModule}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Modules
                  </Button>
                </div>
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
              disabled={
                createCourseMutation.isPending ||
                createModuleMutation.isPending ||
                updateModuleMutation.isPending ||
                updateCourseMutation.isPending
              }
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

function createEmptyModule(): Module {
  return {
    tempId: createTempId(),
    name: "",
    videos: [],
    resources: [],
    isCreated: false,
    creationFailed: false,
  }
}

function buildModulePayload(module: Module) {
  return {
    name: module.name.trim(),
    videos: module.videos
      .filter((video) => Boolean(video.s3Url || video.url))
      .map((video, index) => ({
        name: video.name,
        no: index + 1,
        url: video.s3Url || video.url,
      })),
    resources: module.resources
      .filter((resource) => Boolean(resource.s3Url || resource.url))
      .map((resource) => ({
        name: resource.name,
        url: resource.s3Url || resource.url,
      })),
  }
}

function hasModuleContent(module: Module) {
  return Boolean(module.name.trim() || module.videos.length || module.resources.length)
}

function getAssetPath(value: string) {
  const sanitizedValue = value.split("#")[0].split("?")[0]

  try {
    return new URL(sanitizedValue).pathname
  } catch {
    return sanitizedValue
  }
}

function getAssetExtension(url: string, name?: string) {
  const source = name && name.includes(".") ? name : getAssetPath(url).split("/").pop() || ""
  const extension = source.split(".").pop()

  return extension ? extension.toLowerCase() : ""
}

function getAssetKind(url: string, name?: string) {
  const extension = getAssetExtension(url, name)

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(extension)) {
    return "image"
  }

  if (["mp4", "mov", "webm", "m4v", "ogg"].includes(extension)) {
    return "video"
  }

  if (extension === "pdf") {
    return "pdf"
  }

  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return "document"
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "spreadsheet"
  }

  if (["mp3", "wav", "aac", "m4a"].includes(extension)) {
    return "audio"
  }

  return "file"
}

function getVideoMimeType(url: string, name?: string) {
  const extension = getAssetExtension(url, name)

  if (extension === "mov") return "video/quicktime"
  if (extension === "webm") return "video/webm"
  if (extension === "ogg") return "video/ogg"
  if (extension === "m4v") return "video/x-m4v"

  return "video/mp4"
}

function renderExistingResourcePreview(resource: ExistingModuleAsset, onRemove: () => void) {
  const kind = getAssetKind(resource.url, resource.name)
  const extension = getAssetExtension(resource.url, resource.name) || "file"

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{resource.name}</p>
          <p className="truncate text-xs text-gray-500">{resource.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {kind === "image" && (
        <img
          src={resource.url}
          alt={resource.name}
          className="max-h-72 w-full rounded-md border bg-muted/20 object-contain"
        />
      )}

      {kind === "pdf" && (
        <iframe src={resource.url} title={resource.name} className="h-72 w-full rounded-md border bg-white" />
      )}

      {kind === "audio" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border bg-white p-4">
            <FileAudio className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Audio preview</p>
          </div>
          <audio controls className="w-full">
            <source src={resource.url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {kind !== "image" && kind !== "pdf" && kind !== "audio" && (
        <div className="flex items-center gap-3 rounded-md border bg-white p-4">
          {kind === "document" && <FileText className="h-5 w-5 text-primary" />}
          {kind === "spreadsheet" && <FileSpreadsheet className="h-5 w-5 text-primary" />}
          {kind === "file" && <File className="h-5 w-5 text-primary" />}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground break-words">{resource.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{extension}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function getExistingModules(course?: any): ExistingModule[] {
  if (!course || !Array.isArray(course.modules)) {
    return []
  }

  return course.modules.map((module: any) => ({
    _id: module?._id || "",
    name: module?.name || "",
    video: Array.isArray(module?.video) ? module.video : [],
    resources: Array.isArray(module?.resources) ? module.resources : [],
    assignment: Array.isArray(module?.assignment) ? module.assignment : [],
  }))
}
