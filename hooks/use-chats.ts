"use client"

import { useQuery } from "@tanstack/react-query"

interface Chat {
  _id: string
  title: string
  participants: string[]
  isGroupChat: boolean
  lastMessage?: {
    _id: string
    content: string
    sender: {
      name: string
      avatar?: {
        url: string
      }
    }
    createdAt: string
  }
  createdAt: string
  updatedAt: string
}

async function fetchChats(): Promise<Chat[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined")
  }

  const response = await fetch(`${baseUrl}/chat/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch chats")
  }

  const data = await response.json()
  return data.data || []
}

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}
