"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

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

async function fetchChat(chatId: string): Promise<Chat> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const { data: session } = useSession();
   const role = session?.user?.role;
   console.log(role)
  const token = session?.accessToken || "";
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
    throw new Error("Failed to fetch chat")
  }

  const data = await response.json()
  const chats = data.data || []
  const chat = chats.find((c: Chat) => c._id === chatId)

  if (!chat) {
    throw new Error("Chat not found")
  }

  return chat
}

export function useChat(chatId: string) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => fetchChat(chatId),
    enabled: !!chatId,
  })
}
