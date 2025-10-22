"use client"

import { useState } from "react"
import { ChatList } from "./chat-list"
import { ChatWindow } from "./chat-window"

export function CommunityDashboard() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />

      {/* Main Content */}
      {selectedChatId ? (
        <ChatWindow chatId={selectedChatId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Select a chat to start messaging</p>
        </div>
      )}
    </div>
  )
}
