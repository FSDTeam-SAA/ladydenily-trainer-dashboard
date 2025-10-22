"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

interface ChatListProps {
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
}

interface Chat {
  _id: string
  title: string
  lastMessage?: {
    content?: string
    sender?: {
      avatar?: {
        url?: string
      }
    }
  }
}

async function fetchChats(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch chats")
  }

  const data = await res.json()
  console.log("Chat list response:", data) // 👀 Debug shape
  return data
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const { data: session } = useSession()
  const token = session?.accessToken || ""
  const [searchQuery, setSearchQuery] = useState("")

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ["chatList", token],
    queryFn: () => fetchChats(token),
    enabled: !!token, // only run if token exists
  })

  // ✅ Normalize response shape — always an array
  const chats: Chat[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
    ? rawData.data
    : []

  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [chats, searchQuery])

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="text-sm text-muted-foreground mb-2">Dashboard &gt; Community</div>
        <h1 className="text-2xl font-semibold text-foreground">Community</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search Community"
            className="pl-10 bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
        ) : isError ? (
          <div className="p-4 text-center text-destructive">Failed to load chats.</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No chats found</div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => onSelectChat(chat._id)}
              className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition-colors ${
                selectedChatId === chat._id ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={chat.lastMessage?.sender?.avatar?.url || "/placeholder.svg"}
                    alt={chat.title}
                  />
                  <AvatarFallback>{chat.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{chat.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
