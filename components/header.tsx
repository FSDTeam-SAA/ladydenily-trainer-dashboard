"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, User } from "lucide-react"

export function Header() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <header className="flex h-16 items-center justify-end px-6 bg-background border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-secondary">{session?.user?.name || "Alex rock"}</span>
        <span className="text-xs text-muted-foreground">{session?.user?.role || "Admin"}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src="/admin-user-avatar.png" />
          <AvatarFallback>{session?.user?.name?.charAt(0) || "AR"}</AvatarFallback>
        </Avatar>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
