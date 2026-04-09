"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { profileAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";

type ProfileForm = {
  name: string;
  phone: string;
  age: string;
  gender: string;
  nationality: string;
  address: string;
};

const DEFAULT_FORM: ProfileForm = {
  name: "",
  phone: "",
  age: "",
  gender: "",
  nationality: "",
  address: "",
};

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(DEFAULT_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    data: profileResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: profileAPI.getProfile,
  });

  const profile = profileResponse?.data;

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      age: profile.age || "",
      gender:
        typeof profile.gender === "string" &&
        GENDER_OPTIONS.some((option) => option.value === profile.gender.toLowerCase())
          ? profile.gender.toLowerCase()
          : "",
      nationality: profile.nationality || "",
      address: typeof profile.address === "string" ? profile.address : "",
    });
    setAvatarFile(null);
  }, [profile]);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profile?.avatar?.url || "";
  }, [avatarFile, profile?.avatar?.url]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl && avatarFile) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarFile, avatarPreviewUrl]);

  const updateMutation = useMutation({
    mutationFn: () =>
      profileAPI.updateProfile({
        ...form,
        avatar: avatarFile,
      }),
    onSuccess: async (response) => {
      toast({
        title: "Profile updated",
        description:
          response.message || "Your profile has been updated successfully.",
      });
      await refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description:
          error?.response?.data?.message || "Unable to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setIsChangingPassword(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to change password");
      }

      toast({
        title: "Success",
        description: result?.message || "Password changed successfully!",
      });
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setPasswordError("");
    } catch (error: any) {
      setPasswordError(error?.message || "An error occurred while changing the password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 pt-16 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6 pt-16">
        <div className="bg-card rounded-lg border border-border p-6 space-y-3">
          <p className="text-red-500">Failed to load profile.</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16">
      <div className="flex items-center justify-between">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Dashboard &gt; settings
          </p>
        </div>
        <div>
          <Button
            className="text-white"
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change password
          </Button>
        </div>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="relative">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-muted-foreground"
                onClick={() => setShowOldPassword((prev) => !prev)}
              >
                {showOldPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-muted-foreground"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg border border-border p-6 space-y-6 max-w-3xl"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={avatarPreviewUrl || "/placeholder.svg"}
              alt={form.name || "User"}
            />
            <AvatarFallback>
              {(form.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Photo</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              value={form.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={form.gender || undefined}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={form.nationality}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
