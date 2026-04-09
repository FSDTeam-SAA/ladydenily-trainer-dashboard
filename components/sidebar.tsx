"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import {
  LayoutDashboard,
  User,
  Radio,
  LogOut,
  BookOpenText,
  Settings,
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
} from "@/components/ui/dialog";
import Image from "next/image";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses-list", icon: BookOpenText },
  { name: "Students", href: "/students", icon: User },
  { name: "Community", href: "/community", icon: Radio },
  { name: "Settings", href: "/settings", icon: Settings },
];

const handleSignOut = () => {
  signOut({ callbackUrl: "/auth/login" });
};

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <div className="flex max-h-screen w-52 flex-col bg-sidebar border-r border-sidebar-border sticky top-0">
      {/* Logo */}
      <div className="flex items-center p-4">
        <Link href="/dashboard">
          <Image
            src="/LTA_LOGO.png"
            alt="Logo"
            width={1000}
            height={1000}
            className="w-[151px] h-[80px]"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const normalizedPathname =
            pathname.length > 1 && pathname.endsWith("/")
              ? pathname.slice(0, -1)
              : pathname;
          const normalizedHref =
            item.href.length > 1 && item.href.endsWith("/")
              ? item.href.slice(0, -1)
              : item.href;
          const isOverviewRoute = normalizedHref === "/dashboard";
          const isActive = isOverviewRoute
            ? normalizedPathname === "/dashboard" || normalizedPathname === "/"
            : normalizedPathname === normalizedHref ||
              normalizedPathname.startsWith(normalizedHref + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-4 my-4 text-sm font-medium rounded-md transition-colors",
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
