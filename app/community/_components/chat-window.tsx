"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Send, Paperclip, Smile } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChatWindowProps {
  chatId: string
}

interface Message {
  _id: string
  sender?: {
    name?: string
    avatar?: { url?: string }
  }
  content: string
  createdAt: string
  fileUrl?: string[]
}

interface ChatDetails {
  title?: string
  isGroupChat?: boolean
  lastMessage?: { sender?: { avatar?: { url?: string } } }
}

// --- Fetch messages ---
async function fetchMessages(chatId: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/messages/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch messages")
  return res.json()
}

// --- Send message mutation ---
async function sendMessageRequest({
  chatId,
  content,
  token,
}: {
  chatId: string
  content: string
  token: string
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chatId, content }),
  })
  if (!res.ok) throw new Error("Failed to send message")
  return res.json()
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { data: session } = useSession()
  const token = session?.accessToken || ""

  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesLength = useRef(0)
  const queryClient = useQueryClient()

  // --- Messages query ---
  const {
    data: messagesData,
    isLoading,
  } = useQuery({
    queryKey: ["chatMessages", chatId, token],
    queryFn: () => fetchMessages(chatId, token),
    enabled: !!token && !!chatId,
  })

  const messages: Message[] = Array.isArray(messagesData)
    ? messagesData
    : messagesData?.data || []

  // --- Send message mutation ---
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (vars: { chatId: string; content: string }) =>
      sendMessageRequest({ ...vars, token }),
    onSuccess: () => {
      setMessageText("")
      queryClient.invalidateQueries({ queryKey: ["chatMessages", chatId, token] })
    },
  })

  const handleSendMessage = () => {
    if (!messageText.trim()) return
    sendMessage({ chatId, content: messageText })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // --- Scroll to bottom on new messages ---
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessagesLength.current = messages.length
  }, [messages])

  // Dummy chat info (replace with actual metadata if available)
  const chat: ChatDetails = { title: "Community Chat", isGroupChat: false }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={chat?.lastMessage?.sender?.avatar?.url || "/placeholder.svg"}
              alt={chat?.title}
            />
            <AvatarFallback>{chat?.title?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{chat?.title}</h2>
            <p className="text-xs text-muted-foreground">
              {chat?.isGroupChat ? "Group chat" : "Direct message"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          [...messages].reverse().map((message) => (
            <div key={message._id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={message.sender?.avatar?.url || "/placeholder.svg"}
                  alt={message.sender?.name}
                />
                <AvatarFallback>
                  {message.sender?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">
                    {message.sender?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-3 max-w-xs">
                  <p className="text-foreground text-sm">{message.content}</p>
                  {message.fileUrl?.length ? (
                    <div className="mt-2 space-y-1">
                      {message.fileUrl.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline block"
                        >
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card pb-16">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message..."
              className="pr-10"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={handleSendMessage}
            disabled={isPending || !messageText.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
