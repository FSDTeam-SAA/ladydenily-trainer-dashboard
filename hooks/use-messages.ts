"use client"

import { useQuery } from "@tanstack/react-query"

interface Message {
  _id: string
  chatId: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: {
      url: string
    }
  }
  content: string
  contentType: string
  fileUrl: string[]
  createdAt: string
  updatedAt: string
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined")
  }

  const response = await fetch(`${baseUrl}/chat/messages/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch messages")
  }

  const data = await response.json()
  return data.data || []
}

export function useMessages(chatId: string) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId),
    enabled: !!chatId,
    refetchInterval: 3000, // Refetch every 3 seconds
  })
}
