"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { trainersAPI, type CreateTrainerData } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, X, Plus } from "lucide-react"

interface AddTrainerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddTrainerModal({ isOpen, onClose, onSuccess }: AddTrainerModalProps) {
  const [formData, setFormData] = useState<CreateTrainerData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    username: "",
    address: {
      city: "",
      state: "",
      street: "",
      zipCode: "",
    },
    treding_profile: {
      trading_exprience: "",
      assets_of_interest: "",
      main_goal: "",
      risk_appetite: "",
      preffered_learning: [],
    },
  })

  const [learningInput, setLearningInput] = useState("")

  const addTrainerMutation = useMutation({
    mutationFn: trainersAPI.addTrainer,
    onSuccess: () => {
      toast.success("Trainer added successfully")
      onSuccess()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add trainer")
    },
  })

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      username: "",
      address: {
        city: "",
        state: "",
        street: "",
        zipCode: "",
      },
      treding_profile: {
        trading_exprience: "",
        assets_of_interest: "",
        main_goal: "",
        risk_appetite: "",
        preffered_learning: [],
      },
    })
    setLearningInput("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addTrainerMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateTrainerData],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const addLearningItem = () => {
    if (learningInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        treding_profile: {
          ...prev.treding_profile,
          preffered_learning: [...prev.treding_profile.preffered_learning, learningInput.trim()],
        },
      }))
      setLearningInput("")
    }
  }

  const removeLearningItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      treding_profile: {
        ...prev.treding_profile,
        preffered_learning: prev.treding_profile.preffered_learning.filter((_, i) => i !== index),
      },
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Trainer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange("address.street", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange("address.city", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange("address.state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange("address.zipCode", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Trading Profile</h3>
            <div className="space-y-2">
              <Label htmlFor="trading_exprience">Trading Experience</Label>
              <Select
                value={formData.treding_profile.trading_exprience}
                onValueChange={(value) => handleInputChange("treding_profile.trading_exprience", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-6 month">0-6 months</SelectItem>
                  <SelectItem value="6-12 month">6-12 months</SelectItem>
                  <SelectItem value="1-2 years">1-2 years</SelectItem>
                  <SelectItem value="2+ years">2+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assets_of_interest">Assets of Interest</Label>
              <Input
                id="assets_of_interest"
                value={formData.treding_profile.assets_of_interest}
                onChange={(e) => handleInputChange("treding_profile.assets_of_interest", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_goal">Main Goal</Label>
              <Textarea
                id="main_goal"
                value={formData.treding_profile.main_goal}
                onChange={(e) => handleInputChange("treding_profile.main_goal", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk_appetite">Risk Appetite</Label>
              <Input
                id="risk_appetite"
                value={formData.treding_profile.risk_appetite}
                onChange={(e) => handleInputChange("treding_profile.risk_appetite", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preffered_learning">Preferred Learning Methods</Label>
              <div className="flex gap-2">
                <Input
                  id="preffered_learning"
                  value={learningInput}
                  onChange={(e) => setLearningInput(e.target.value)}
                  placeholder="Enter learning method"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addLearningItem()
                    }
                  }}
                />
                <Button type="button" onClick={addLearningItem} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.treding_profile.preffered_learning.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.treding_profile.preffered_learning.map((item, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {item}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeLearningItem(index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={addTrainerMutation.isPending}>
              {addTrainerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Trainer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
