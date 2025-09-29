"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  useTrainers,
  useCreateCourse,
  useUpdateCourse,
  type Course,
  type CreateCourseData,
} from "@/lib/coursesapi";
import { moduleApi } from "@/lib/coursesapi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Upload,
  X,
  Plus,
  Save,
  FileText,
  Video,
  Download,
  Play,
} from "lucide-react";
import QuillEditor from "./QuillEditor";

interface CourseFormProps {
  course?: Course;
  onSave?: (course: any) => void;
  onCancel?: () => void;
}

interface UploadedFile {
  file: File;
  url: string;
  name: string;
  type: string;
  size: number;
}

interface ModuleFormData {
  id?: string;
  tempId: string;
  name: string;
  videos: UploadedFile[];
  resources: UploadedFile[];
  assignment?: { title: string; start: string }[];
  isCreated?: boolean;
  moduleId?: string;
  isCreating?: boolean;
  creationFailed?: boolean;
}

export function CourseForm({ course, onSave, onCancel }: CourseFormProps) {
  const { data: session } = useSession();
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>(
    course?.coordinator?.map((c) => c._id) || []
  );

  const [modules, setModules] = useState<ModuleFormData[]>(
    course?.modules?.map((m) => ({
      id: m._id,
      tempId: crypto.randomUUID(),
      name: m.name,
      videos:
        m.video?.map((v) => ({
          file: new File([], v.name),
          url: v.url,
          name: v.name,
          type: "video/*",
          size: 0,
        })) || [],
      resources:
        m.resources?.map((r) => ({
          file: new File([], r.name),
          url: r.url,
          name: r.name,
          type: "application/pdf",
          size: 0,
        })) || [],
      isCreated: true,
      moduleId: m._id,
    })) || [
      { tempId: crypto.randomUUID(), name: "", videos: [], resources: [] },
    ]
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(course?.photo || "");
  const [isCreatingAllModules, setIsCreatingAllModules] = useState(false);
  const [allModulesCreated, setAllModulesCreated] = useState(false);
  const [moduleCreationProgress, setModuleCreationProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: trainersResponse } = useTrainers(session?.accessToken);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  const trainers = trainersResponse?.data?.trainers || [];

  const form = useForm<CreateCourseData>({
    defaultValues: {
      name: course?.name || "",
      description: course?.description || "",
      price: course?.price,
      offerPrice: course?.offerPrice,
      coordinator: selectedCoordinators, // Use the state here
      modules: [],
    },
  });

  useEffect(() => {
    console.log("Full modules state:", modules);
    const hasModules = modules.length > 0;
    const validModules = modules.filter((module) => module.name.trim());
    const allModulesHaveIds =
      validModules.length > 0 &&
      validModules.every((module) => module.moduleId && !module.creationFailed);
    const noModulesCreating = !isCreatingAllModules;

    console.log("allModulesCreated check:", {
      hasModules,
      allModulesHaveIds,
      noModulesCreating,
      validModules,
    });

    setAllModulesCreated(hasModules && allModulesHaveIds && noModulesCreating);

    if (!isCreatingAllModules && modules.some((m) => m.isCreating)) {
      console.warn(
        "Detected modules stuck in isCreating state:",
        modules.filter((m) => m.isCreating)
      );
      setModules((prev) =>
        prev.map((m) =>
          m.isCreating && !m.moduleId
            ? { ...m, isCreating: false, creationFailed: true }
            : m
        )
      );
    }
  }, [modules, isCreatingAllModules]);

  const createModule = async (
    moduleData: ModuleFormData,
    token: string
  ): Promise<string> => {
    if (!moduleData.name || !moduleData.name.trim()) {
      throw new Error("Module name is required");
    }

    const formData = new FormData();
    formData.append("name", moduleData.name.trim());
    moduleData.videos.forEach((video) => {
      formData.append("video", video.file);
    });
    moduleData.resources.forEach((resource) => {
      formData.append("resources", resource.file);
    });
    if (moduleData.assignment && moduleData.assignment.length > 0) {
      formData.append("assignment", JSON.stringify(moduleData.assignment));
    }

    console.log(`Creating module with data (tempId: ${moduleData.tempId}):`);
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const response = await moduleApi.createModule(formData, token);
      console.log(
        `Module creation response (tempId: ${moduleData.tempId}):`,
        response
      );
      if (!response?.data?._id) {
        throw new Error(
          `Invalid module creation response: ${JSON.stringify(response)}`
        );
      }
      return response.data._id;
    } catch (error) {
      console.error(
        `Failed to create module: ${moduleData.name} (tempId: ${moduleData.tempId})`,
        error
      );
      throw error;
    }
  };

  const createAllModules = async (): Promise<string[]> => {
    if (!session?.accessToken) throw new Error("No access token");

    const modulesToCreate = modules.filter(
      (module) => !module.moduleId && module.name.trim()
    );
    if (modulesToCreate.length === 0) {
      return modules
        .filter((module) => module.moduleId)
        .map((module) => module.moduleId!) as string[];
    }

    setIsCreatingAllModules(true);
    setModuleCreationProgress({ current: 0, total: modulesToCreate.length });

    const moduleIds: string[] = [];
    try {
      modules.forEach((module) => {
        if (module.moduleId) {
          moduleIds.push(module.moduleId);
        }
      });

      for (let i = 0; i < modulesToCreate.length; i++) {
        const module = modulesToCreate[i];
        try {
          console.log(
            `Creating module ${i + 1}/${modulesToCreate.length}: ${
              module.name
            } (tempId: ${module.tempId})`
          );
          setModules((prev) =>
            prev.map((m) =>
              m.tempId === module.tempId
                ? { ...m, isCreating: true, creationFailed: false }
                : m
            )
          );
          const moduleId = await createModule(module, session.accessToken);
          setModules((prev) => {
            const newModules = prev.map((m) =>
              m.tempId === module.tempId
                ? {
                    ...m,
                    isCreated: true,
                    moduleId,
                    isCreating: false,
                    creationFailed: false,
                  }
                : m
            );
            console.log("Updated modules state after creation:", newModules);
            return newModules;
          });
          moduleIds.push(moduleId);
          setModuleCreationProgress({
            current: i + 1,
            total: modulesToCreate.length,
          });
          console.log(
            `Successfully created module: ${module.name} with ID: ${moduleId}`
          );
        } catch (error) {
          console.error(
            `Failed to create module: ${module.name} (tempId: ${module.tempId})`,
            error
          );
          setModules((prev) =>
            prev.map((m) =>
              m.tempId === module.tempId
                ? { ...m, isCreating: false, creationFailed: true }
                : m
            )
          );
          throw new Error(`Failed to create module "${module.name}": ${error}`);
        }
      }
      console.log(`Successfully created all ${modulesToCreate.length} modules`);
      return moduleIds;
    } catch (error) {
      console.error("Error in batch module creation:", error);
      throw error;
    } finally {
      console.log("Finished module creation, resetting isCreatingAllModules");
      setIsCreatingAllModules(false);
      setModuleCreationProgress({ current: 0, total: 0 });
    }
  };

  const handleCreateAllModules = async () => {
    if (!session?.accessToken) {
      console.error("No access token available");
      return;
    }

    const modulesToCreate = modules.filter((m) => !m.moduleId && m.name.trim());
    if (modulesToCreate.length === 0) {
      console.log("No modules to create");
      return;
    }

    try {
      console.log(
        `Starting batch creation of ${modulesToCreate.length} modules`
      );
      await createAllModules();
      console.log("All modules created successfully!");
    } catch (error) {
      console.error("Failed to create modules:", error);
    }
  };

  const retryModuleCreation = async (moduleIndex: number) => {
    if (!session?.accessToken) return;
    const module = modules[moduleIndex];
    try {
      setModules((prev) =>
        prev.map((m) =>
          m.tempId === module.tempId
            ? { ...m, isCreating: true, creationFailed: false }
            : m
        )
      );
      const moduleId = await createModule(module, session.accessToken);
      setModules((prev) => {
        const newModules = prev.map((m) =>
          m.tempId === module.tempId
            ? {
                ...m,
                isCreated: true,
                moduleId,
                isCreating: false,
                creationFailed: false,
              }
            : m
        );
        console.log("Modules state after retry:", newModules);
        return newModules;
      });
      console.log(
        `Module recreated successfully: ${module.name} with ID: ${moduleId}`
      );
    } catch (error) {
      setModules((prev) =>
        prev.map((m) =>
          m.tempId === module.tempId
            ? { ...m, isCreating: false, creationFailed: true }
            : m
        )
      );
      console.error(
        `Retry failed for module: ${module.name} (tempId: ${module.tempId})`,
        error
      );
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addModule = () => {
    setModules([
      ...modules,
      { tempId: crypto.randomUUID(), name: "", videos: [], resources: [] },
    ]);
  };

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      const moduleToRemove = modules[index];
      moduleToRemove.videos.forEach((video) => {
        if (video.url.startsWith("blob:")) {
          URL.revokeObjectURL(video.url);
        }
      });
      moduleToRemove.resources.forEach((resource) => {
        if (resource.url.startsWith("blob:")) {
          URL.revokeObjectURL(resource.url);
        }
      });
      setModules(modules.filter((_, i) => i !== index));
    }
  };

  const updateModule = (
    index: number,
    field: keyof ModuleFormData,
    value: any
  ) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    if (field === "name" && updatedModules[index].isCreated) {
      updatedModules[index].isCreated = false;
      updatedModules[index].moduleId = undefined;
      updatedModules[index].creationFailed = false;
    }
    setModules(updatedModules);
  };

  const handleVideoUpload = (index: number, files: FileList | null) => {
    if (files) {
      const newVideos: UploadedFile[] = Array.from(files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      const updatedModules = [...modules];
      updatedModules[index].videos = [
        ...updatedModules[index].videos,
        ...newVideos,
      ];
      updatedModules[index].isCreated = false;
      updatedModules[index].moduleId = undefined;
      updatedModules[index].creationFailed = false;
      setModules(updatedModules);
    }
  };

  const handleResourceUpload = (index: number, files: FileList | null) => {
    if (files) {
      const newResources: UploadedFile[] = Array.from(files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      const updatedModules = [...modules];
      updatedModules[index].resources = [
        ...updatedModules[index].resources,
        ...newResources,
      ];
      updatedModules[index].isCreated = false;
      updatedModules[index].moduleId = undefined;
      updatedModules[index].creationFailed = false;
      setModules(updatedModules);
    }
  };

  const removeVideo = (moduleIndex: number, videoIndex: number) => {
    const updatedModules = [...modules];
    const video = updatedModules[moduleIndex].videos[videoIndex];
    if (video.url.startsWith("blob:")) {
      URL.revokeObjectURL(video.url);
    }
    updatedModules[moduleIndex].videos = updatedModules[
      moduleIndex
    ].videos.filter((_, i) => i !== videoIndex);
    updatedModules[moduleIndex].isCreated = false;
    updatedModules[moduleIndex].moduleId = undefined;
    updatedModules[moduleIndex].creationFailed = false;
    setModules(updatedModules);
  };

  const removeResource = (moduleIndex: number, resourceIndex: number) => {
    const updatedModules = [...modules];
    const resource = updatedModules[moduleIndex].resources[resourceIndex];
    if (resource.url.startsWith("blob:")) {
      URL.revokeObjectURL(resource.url);
    }
    updatedModules[moduleIndex].resources = updatedModules[
      moduleIndex
    ].resources.filter((_, i) => i !== resourceIndex);
    updatedModules[moduleIndex].isCreated = false;
    updatedModules[moduleIndex].moduleId = undefined;
    updatedModules[moduleIndex].creationFailed = false;
    setModules(updatedModules);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/")) {
      return <Video className="w-4 h-4 text-blue-500" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    } else {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const onSubmit = async (data: CreateCourseData) => {
  if (!session?.accessToken) {
    console.error("No access token available");
    return;
  }
  if (selectedCoordinators.length === 0) {
    console.error("At least one coordinator is required");
    return;
  }
  if (!allModulesCreated) {
    console.error("All modules must be created and have IDs first", {
      modules,
    });
    return;
  }

  try {
    const moduleIds = modules
      .filter((module) => module.moduleId && module.name.trim())
      .map((module) => module.moduleId) as string[];

    console.log(
      `Using ${moduleIds.length} module IDs for course creation:`,
      moduleIds
    );

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("price", data.price.toString());
    formData.append("offerPrice", data.offerPrice.toString());
    formData.append("coordinator", JSON.stringify(selectedCoordinators)); // Updated line
    formData.append("modules", JSON.stringify(moduleIds));
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    console.log("Submitting Course FormData:");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    if (course) {
      await updateCourseMutation.mutateAsync({
        id: course._id,
        data: formData,
        token: session.accessToken,
      });
      console.log("Course updated successfully");
    } else {
      await createCourseMutation.mutateAsync({
        data: formData,
        token: session.accessToken,
      });
      console.log("Course created successfully");
    }

    onSave?.(formData);
  } catch (error) {
    console.error("Failed to save course:", error);
  }
};

  const selectedTrainers = trainers.filter((trainer) =>
    selectedCoordinators.includes(trainer._id)
  );

  const hasUnCreatedModules = modules.some(
    (module) => !module.moduleId && module.name.trim()
  );
  const hasFailedModules = modules.some((module) => module.creationFailed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {course ? "Edit Course" : "Create Course"}
          </h1>
          <p className="text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
        <div className="flex gap-2">
          {allModulesCreated && (
            <Button
              onClick={() => form.handleSubmit(onSubmit)()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {createCourseMutation.isPending || updateCourseMutation.isPending
                ? "Saving Course..."
                : "Create Course"}
            </Button>
          )}
        </div>
      </div>

      {isCreatingAllModules && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">
              Creating modules... ({moduleCreationProgress.current}/
              {moduleCreationProgress.total})
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  moduleCreationProgress.total > 0
                    ? (moduleCreationProgress.current /
                        moduleCreationProgress.total) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {allModulesCreated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">
              All modules created with IDs successfully! You can now create the
              course.
            </span>
          </div>
        </div>
      )}

      {hasFailedModules && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">
              Some modules failed to create. Please fix the issues and try
              again.
            </span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Type course name here..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <div className="space-y-2">
                    <FormLabel>Course Photo</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="Course preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={removePhoto}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-4">
                            Upload course image (Optional)
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"
                          >
                            Add Image
                          </Button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offerPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offer Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <FormLabel>Coordinators *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (!selectedCoordinators.includes(value)) {
                          setSelectedCoordinators([
                            ...selectedCoordinators,
                            value,
                          ]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select coordinator..." />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer._id} value={trainer._id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage
                                  src={
                                    trainer.avatar?.url || "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {trainer.name?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{trainer.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCoordinators.length === 0 && (
                      <p className="text-red-500 text-sm mt-1">
                        At least one coordinator is required.
                      </p>
                    )}
                    {selectedTrainers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTrainers.map((trainer) => (
                          <Badge
                            key={trainer._id}
                            variant="secondary"
                            className="flex items-center gap-2 px-3 py-1"
                          >
                            <Avatar className="w-4 h-4">
                              <AvatarImage
                                src={trainer.avatar?.url || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-xs">
                                {trainer.name?.charAt(0) || "T"}
                              </AvatarFallback>
                            </Avatar>
                            {trainer.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => {
                                setSelectedCoordinators(
                                  selectedCoordinators.filter(
                                    (id) => id !== trainer._id
                                  )
                                );
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Course Modules</h3>
                    <span className="text-sm text-muted-foreground">
                      {modules.length} module(s)
                    </span>
                  </div>

                  {modules.map((module, moduleIndex) => (
                    <Card key={module.tempId} className="relative">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Module {moduleIndex + 1}
                            {module.isCreating && (
                              <>
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-blue-600"
                                >
                                  Creating...
                                </Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    retryModuleCreation(moduleIndex)
                                  }
                                  className="ml-2"
                                >
                                  Retry
                                </Button>
                              </>
                            )}
                            {module.moduleId &&
                              !module.isCreating &&
                              !module.creationFailed && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-green-600"
                                >
                                  ✓ Created (ID: {module.moduleId.slice(-6)})
                                </Badge>
                              )}
                            {module.creationFailed && (
                              <>
                                <Badge variant="destructive" className="ml-2">
                                  ✗ Failed
                                </Badge>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    retryModuleCreation(moduleIndex)
                                  }
                                  className="ml-2"
                                >
                                  Retry
                                </Button>
                              </>
                            )}
                          </CardTitle>
                          {modules.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeModule(moduleIndex)}
                              className="h-8 w-8 text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <FormLabel>Module Name *</FormLabel>
                          <Input
                            placeholder="Enter module name..."
                            value={module.name}
                            onChange={(e) =>
                              updateModule(moduleIndex, "name", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <FormLabel>Videos</FormLabel>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center mb-4">
                              <Video className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                              <p className="text-sm text-gray-500 mb-2">
                                Upload video files (MP4, AVI, MOV, etc.)
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept = "video/*";
                                  input.multiple = true;
                                  input.onchange = (e) =>
                                    handleVideoUpload(
                                      moduleIndex,
                                      (e.target as HTMLInputElement).files
                                    );
                                  input.click();
                                }}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Add Videos
                              </Button>
                            </div>

                            {module.videos.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                  Uploaded Videos ({module.videos.length})
                                </p>
                                {module.videos.map((video, videoIndex) => (
                                  <div
                                    key={videoIndex}
                                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <Video className="w-5 h-5 text-blue-600" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {video.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(video.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 bg-transparent"
                                        onClick={() =>
                                          window.open(video.url, "_blank")
                                        }
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        Play
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          removeVideo(moduleIndex, videoIndex)
                                        }
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <FormLabel>Resources</FormLabel>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <div className="text-center mb-4">
                              <FileText className="w-8 h-8 mx-auto text-green-500 mb-2" />
                              <p className="text-sm text-gray-500 mb-2">
                                Upload PDFs, documents, presentations
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.accept =
                                    ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx";
                                  input.multiple = true;
                                  input.onchange = (e) =>
                                    handleResourceUpload(
                                      moduleIndex,
                                      (e.target as HTMLInputElement).files
                                    );
                                  input.click();
                                }}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Add Resources
                              </Button>
                            </div>

                            {module.resources.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                  Uploaded Resources ({module.resources.length})
                                </p>
                                {module.resources.map(
                                  (resource, resourceIndex) => (
                                    <div
                                      key={resourceIndex}
                                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        {getFileIcon(resource.type)}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {resource.name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(resource.size)} •{" "}
                                            {resource.type.split("/")[1] ||
                                              resource.type}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 bg-transparent"
                                          onClick={() =>
                                            window.open(resource.url, "_blank")
                                          }
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            removeResource(
                                              moduleIndex,
                                              resourceIndex
                                            )
                                          }
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    onClick={handleCreateAllModules}
                    disabled={
                      isCreatingAllModules ||
                      !hasUnCreatedModules ||
                      modules.length === 0 ||
                      modules.every((m) => !m.name.trim())
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                  >
                    {isCreatingAllModules
                      ? `Creating All Modules... (${moduleCreationProgress.current}/${moduleCreationProgress.total})`
                      : hasUnCreatedModules
                      ? `Create All Modules (${
                          modules.filter((m) => !m.moduleId && m.name.trim())
                            .length
                        })`
                      : "All Modules Created"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addModule}
                    className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700 bg-transparent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Modules
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !allModulesCreated ||
                createCourseMutation.isPending ||
                updateCourseMutation.isPending
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {createCourseMutation.isPending || updateCourseMutation.isPending
                ? "Saving..."
                : course
                ? "Update Course"
                : "Create Course"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
