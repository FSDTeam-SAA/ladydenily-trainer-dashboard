import { Search, FileText, ImageIcon, Paperclip, Send, Smile } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const forumData = [
  {
    id: 1,
    name: "SkyscraperCity",
    avatar: "/red-building-icon.jpg",
    lastMessage: "Only coaches can send messages.",
    timestamp: "20/03/2025",
    hasPhoto: true,
    isActive: true,
  },
  {
    id: 2,
    name: "Mercedes-Benz Forum",
    avatar: "/mercedes-logo.png",
    lastMessage: "Hello! Guys",
    timestamp: "Yesterday",
    hasPhoto: false,
    isActive: false,
  },
  {
    id: 3,
    name: "Subaru Outback Forums",
    avatar: "/subaru-logo-blue.jpg",
    lastMessage: "",
    timestamp: "20/03/2025",
    hasPhoto: true,
    isActive: false,
  },
  {
    id: 4,
    name: "Toyota Nation Forum",
    avatar: "/toyota-logo-green.jpg",
    lastMessage: "",
    timestamp: "5:27 am",
    hasDocument: true,
    isActive: false,
  },
  {
    id: 5,
    name: "Cadillac Owners Forum",
    avatar: "/cadillac-logo-black.jpg",
    lastMessage: "Hello! Guys",
    timestamp: "5:27 am",
    isActive: false,
  },
  {
    id: 6,
    name: "Subaru Outback Forums",
    avatar: "/subaru-logo-dark.jpg",
    lastMessage: "",
    timestamp: "5:27 am",
    isActive: false,
  },
]

const chatMessages = [
  {
    id: 1,
    content:
      "Just shared a new analysis on EUR/USD. Looking for a potential breakout above 1.0850. What do you all think?",
    chart: "/forex-candlestick-chart-eur-usd-bullish-pattern.jpg",
    timestamp: "Just now",
  },
  {
    id: 2,
    content:
      "Just shared a new analysis on EUR/USD. Looking for a potential breakout above 1.0850. What do you all think?",
    chart: "/forex-candlestick-chart-eur-usd-bearish-pattern-wi.jpg",
    timestamp: "2 minutes ago",
  },
]

export function CommunityDashboard() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="text-sm text-muted-foreground mb-2">Dashboard &gt; Community</div>
          <h1 className="text-2xl font-semibold text-foreground">Community</h1>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search Community" className="pl-10 bg-muted/50" />
          </div>
        </div>

        {/* Forum List */}
        <div className="flex-1 overflow-y-auto">
          {forumData.map((forum) => (
            <div
              key={forum.id}
              className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 ${
                forum.isActive ? "bg-muted/30" : ""
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={forum.avatar || "/placeholder.svg"} alt={forum.name} />
                <AvatarFallback>{forum.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-foreground truncate">{forum.name}</h3>
                  {forum.hasPhoto && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
                  {forum.hasDocument && <FileText className="h-3 w-3 text-muted-foreground" />}
                  {forum.hasNotification && <div className="h-2 w-2 bg-yellow-500 rounded-full" />}
                </div>
                {forum.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{forum.lastMessage}</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground">{forum.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/red-building-icon.jpg" alt="SkyscraperCity" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">SkyscraperCity</h2>
              <p className="text-xs text-muted-foreground">Only coaches can send messages.</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {chatMessages.map((message) => (
            <div key={message.id} className="bg-muted/30 rounded-lg p-4">
              <div className="mb-3">
                <img
                  src={message.chart || "/placeholder.svg"}
                  alt="Trading Chart"
                  className="w-full max-w-md rounded-lg border border-border"
                />
              </div>
              <p className="text-sm text-foreground mb-2">{message.content}</p>
              <div className="text-xs text-muted-foreground">{message.timestamp}</div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input placeholder="Type a message..." className="pr-10" />
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
