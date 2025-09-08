"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react"; // Added useState for modal state
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  User,
  Radio,
  Gift,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added Dialog imports

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Students", href: "/students", icon: User },
  { name: "Community", href: "/community", icon: Radio },
];

const handleSignOut = () => {
  signOut({ callbackUrl: "/auth/login" });
};

export function Sidebar() {
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Added state for modal

  return (
    <div className="flex h-screen w-52 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : "text-sidebar-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <Button
          className="group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          onClick={() => setIsLogoutModalOpen(true)}
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Logout
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="max-w-md rounded-lg shadow-lg bg-white p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold text-red-600">
              Are you sure you want to log out?
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-2">
              Logging out will end your current session. You'll need to sign in
              again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsLogoutModalOpen(false);
                handleSignOut();
              }}
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}