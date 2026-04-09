"use client"

import { useState } from "react"
import { Upload, X, Play, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/form"

interface UploadedVideo {
  file: File
  url: string
  name: string
  type: string
  size: number
  s3Url?: string
}

interface VideoUploaderProps {
  videos: UploadedVideo[]
  onVideosChange: (videos: UploadedVideo[]) => void
  apiBaseUrl?: string
  label?: string
  description?: string
  buttonText?: string
  accept?: string
  icon?: "upload" | "file"
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks

export function VideoUploader({
  videos,
  onVideosChange,
  apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "/api",
  label = "Videos",
  description = "Upload video files (MP4, AVI, MOV, etc.)",
  buttonText = "Add Videos",
  accept = "video/*",
  icon = "upload",
}: VideoUploaderProps) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number
  }>({})
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({})

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const uploadVideoToS3 = async (file: File): Promise<string> => {
    try {
      const fileName = file.name
      const fileType = file.type

      // Step 1: Initiate multipart upload
      const initiateRes = await fetch(`${baseUrl}/upload/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, fileType }),
      })

      if (!initiateRes.ok) {
        throw new Error("Failed to initiate upload")
      }

      const { data: initiateData } = await initiateRes.json()
      const { uploadId, key } = initiateData

      // Step 2: Upload file in chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const parts: Array<{ PartNumber: number; ETag: string }> = []

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        const partNumber = i + 1

        // Get signed URL for this part
        const signedUrlRes = await fetch(`${baseUrl}/upload/part-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            partNumber,
            key,
            fileType,
          }),
        })

        if (!signedUrlRes.ok) {
          throw new Error(`Failed to get signed URL for part ${partNumber}`)
        }

        const { data: signedUrlData } = await signedUrlRes.json()
        const { signedUrl } = signedUrlData

        // Upload chunk to S3
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": fileType },
        })

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload part ${partNumber}`)
        }

        const etag = uploadRes.headers.get("etag")
        if (!etag) {
          throw new Error(`No ETag returned for part ${partNumber}`)
        }

        parts.push({
          PartNumber: partNumber,
          ETag: etag.replace(/"/g, ""),
        })

        // Update progress
        setUploadProgress((prev) => ({
          ...prev,
          [fileName]: Math.round((partNumber / totalChunks) * 100),
        }))
      }

      // Step 3: Complete multipart upload
      const completeRes = await fetch(`${baseUrl}/upload/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          key,
          parts,
        }),
      })

      if (!completeRes.ok) {
        throw new Error("Failed to complete upload")
      }

      const { data: completeData } = await completeRes.json()
      const { rawFileUrl } = completeData

      return rawFileUrl
    } catch (error) {
      console.error("Upload error:", error)
      throw error
    }
  }

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files) return

    setUploading(true)
    const newErrors: { [key: string]: string } = {}
    let nextVideos = [...videos]

    for (const file of Array.from(files)) {
      try {
        const s3Url = await uploadVideoToS3(file)

        const uploadedVideo: UploadedVideo = {
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          size: file.size,
          s3Url,
        }

        nextVideos = [...nextVideos, uploadedVideo]
        onVideosChange(nextVideos)
        setUploadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      } catch (error) {
        newErrors[file.name] = error instanceof Error ? error.message : "Upload failed"
      }
    }

    setUploadErrors(newErrors)
    setUploading(false)
  }

  const removeVideo = (index: number) => {
    const video = videos[index]
    if (video.url.startsWith("blob:")) {
      URL.revokeObjectURL(video.url)
    }
    onVideosChange(videos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <FormLabel>{label}</FormLabel>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center mb-4">
          {icon === "file" ? (
            <FileText className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          ) : (
            <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          )}
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = accept
              input.multiple = true
              input.onchange = (e) => handleVideoUpload((e.target as HTMLInputElement).files)
              input.click()
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>

        {videos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Uploaded {label.toLowerCase()} ({videos.length})
            </p>
            {videos.map((video, videoIndex) => (
              <div
                key={videoIndex}
                className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                {icon === "upload" && (
                  <video controls preload="metadata" className="w-full rounded-md border bg-black/5">
                    <source src={video.s3Url || video.url} type={video.type || "video/mp4"} />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="flex items-center gap-3 flex-1">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{video.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(video.size)}
                      {video.s3Url && " - Uploaded to S3"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {uploadProgress[video.name] !== undefined && (
                    <span className="text-xs text-blue-600 mr-2">{uploadProgress[video.name]}%</span>
                  )}
                  {icon === "upload" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 bg-transparent"
                      onClick={() => window.open(video.s3Url || video.url, "_blank")}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeVideo(videoIndex)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {Object.keys(uploadErrors).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadErrors).map(([fileName, error]) => (
              <div key={fileName} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>{fileName}:</strong> {error}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
