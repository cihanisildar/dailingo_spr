"use client";

import QueryProvider from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  Globe,
  GraduationCap,
  History,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Plus,
  ScrollText,
  Settings,
  User
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useState } from "react";
import Repeeker_logo from "../../public/repeeker.png";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Review",
    href: "/dashboard/review",
    icon: Clock,
    children: [
      {
        title: "Today's Review",
        href: "/dashboard/review",
        icon: Clock,
      },
      {
        title: "Add Review",
        href: "/dashboard/review/add",
        icon: Plus,
      },
      {
        title: "Upcoming Reviews",
        href: "/dashboard/review/upcoming",
        icon: Calendar,
      },
      {
        title: "Review History",
        href: "/dashboard/review/history",
        icon: History,
      },
      {
        title: "Review Settings",
        href: "/dashboard/review/settings",
        icon: Settings,
      },
    ],
  },
  {
    title: "Test",
    href: "/dashboard/test",
    icon: GraduationCap,
    children: [
      {
        title: "Test Words",
        href: "/dashboard/test",
        icon: GraduationCap,
      },
      {
        title: "Test History",
        href: "/dashboard/test/history",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "My Cards",
    href: "/dashboard/cards",
    icon: CreditCard,
  },
  {
    title: "Word Lists",
    href: "/dashboard/lists",
    icon: List,
  },
];

// Function to generate breadcrumb items
const generateBreadcrumbs = (pathname: string) => {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  // Always start with Dashboard if we're in an authenticated route
  if (paths.length > 0) {
    breadcrumbs.push({
      href: "/dashboard",
      label: "Dashboard",
    });
  }

  // Build the rest of the breadcrumbs
  let currentPath = "";
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    // Skip adding dashboard to breadcrumbs since we already added it
    if (path !== "dashboard") {
      const navItem = navItems.find((item) => item.href === currentPath);

      // For card details pages
      if (paths[index - 1] === "cards") {
        // If it's a UUID format, show "Card Details" instead
        if (path.length > 10) {
          breadcrumbs.push({
            href: currentPath,
            label: "Card Details",
          });
        } else {
          breadcrumbs.push({
            href: currentPath,
            label: navItem?.title || "Cards",
          });
        }
      }
      // For list details pages
      else if (paths[index - 1] === "lists" && path.length > 10) {
        breadcrumbs.push({
          href: currentPath,
          label: "List Details",
        });
      } else {
        breadcrumbs.push({
          href: currentPath,
          label: navItem?.title || path.charAt(0).toUpperCase() + path.slice(1),
        });
      }
    }
  });

  return breadcrumbs;
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenuHref, setOpenSubmenuHref] = useState<string | null>(null);
  const { data: streak } = useStreak({ enabled: status === "authenticated" });
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    redirect("/");
  }

  const renderNavigation = (isMobile = false) => (
    <nav className={cn("flex-1 p-2")}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard" // For Dashboard, only match exact path
            : pathname === item.href || pathname.startsWith(item.href + "/"); // For other items, match path and subpaths
        const isSubmenuOpen = openSubmenuHref === item.href;

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 mb-0.5",
                "hover:bg-gray-100/80 dark:hover:bg-gray-800",
                isActive ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300",
                !isMobile && isCollapsed && "justify-center px-2"
              )}
              onClick={(e) => {
                if (item.children) {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenSubmenuHref(isSubmenuOpen ? null : item.href);
                } else if (isMobile) {
                  setIsMobileMenuOpen(false);
                }
              }}
              title={!isMobile && isCollapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )}
              />
              {(!isMobile || !isCollapsed) && (
                <span className={cn("flex-1", isCollapsed && "hidden")}>
                  {item.title}
                </span>
              )}
              {item.children && !isCollapsed && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isSubmenuOpen && "rotate-90"
                  )}
                />
              )}
            </Link>
            {item.children && isSubmenuOpen && !isCollapsed && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        "hover:bg-gray-100/80 dark:hover:bg-gray-800",
                        isChildActive ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300"
                      )}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    >
                      <ChildIcon
                        className={cn(
                          "h-4 w-4",
                          isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                        )}
                      />
                      <span>{child.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r bg-white dark:bg-gray-950 transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src={Repeeker_logo}
                alt="Repeeker Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              {!isCollapsed && (
                <span className="text-lg font-semibold">Repeeker</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          {renderNavigation()}

          {/* User Profile */}
          <div className="mt-auto border-t p-4">
            <div className={cn(
              "w-full flex items-center gap-3",
              isCollapsed && "justify-center px-2"
            )}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {session.user?.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Sheet wraps the header for mobile menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-950">
              <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4">
                {/* Left: Mobile Menu Button (visible only on mobile) */}
                <div className="flex items-center gap-2 md:hidden">
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                </div>
                {/* Breadcrumbs - only visible on md+ */}
                <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                      )}
                      <Link
                        href={crumb.href}
                        className={cn(
                          "text-sm font-medium truncate max-w-[120px]",
                          index === breadcrumbs.length - 1
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                      >
                        {crumb.label}
                      </Link>
                    </div>
                  ))}
                </div>
                {/* Right: Streak and Profile Icon */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-1 gap-1 min-w-[32px]">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{streak?.currentStreak || 0}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-0 group"
                        style={{ background: 'none', boxShadow: 'none' }}
                      >
                        <div 
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 transition-colors cursor-pointer group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                        >
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/dashboard/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/dashboard/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>
            {/* SheetContent for mobile menu */}
            <SheetContent side="left" className="p-0">
              <div className="flex flex-col h-full">
                <div className="flex h-16 items-center border-b px-4">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                      src={Repeeker_logo}
                      alt="Repeeker Logo"
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                    <span className="text-lg font-semibold">Repeeker</span>
                  </Link>
                </div>
                <div className="flex-1">
                  {renderNavigation(true)}
                </div>
                {/* User Profile for Mobile */}
                <div className="border-t p-4 md:hidden">
                  <div className={cn(
                    "w-full flex items-center gap-3",
                  )}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {session.user?.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.user?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          {/* Page Content */}
          <div className="p-6">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
        </main>
      </div>
    </QueryProvider>
  );
}
