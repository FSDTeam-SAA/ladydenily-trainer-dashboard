"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface SendMessagePayload {
  chatId: string
  content: string
}

async function sendMessage(payload: SendMessagePayload): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not defined")
  }

  const response = await fetch(`${baseUrl}/chat/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to send message")
  }
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
  })
}
