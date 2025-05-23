"use client";

import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Languages,
  Clock,
  BookOpen,
  List,
  Calendar,
  Flame,
  ChevronRight as ChevronRightIcon,
  History,
  CreditCard,
  GraduationCap,
  ScrollText,
  Menu,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useState } from "react";
import QueryProvider from "@/components/providers/query-provider";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";
import dailingo_logo from "../../public/dailingo_logo.png";

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
    children: [
      {
        title: "My Lists",
        href: "/dashboard/lists",
        icon: List,
      },
      {
        title: "Public Lists",
        href: "/dashboard/lists/public",
        icon: Globe,
      },
    ],
  },
];

// Add streak query hook
const useStreak = () => {
  return useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const { data } = await api.get("/streak");
      return data;
    },
  });
};

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
  const { data: streak } = useStreak();
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
                "hover:bg-gray-100/80",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-600",
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
                  "h-4 w-4 flex-shrink-0",
                  isActive && "text-blue-600"
                )}
              />
              {(!isCollapsed || isMobile) && (
                <>
                  <span
                    className={cn(
                      "transition-all duration-200 flex-1",
                      isActive && "font-medium"
                    )}
                  >
                    {item.title}
                  </span>
                  {item.children && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isSubmenuOpen && "transform rotate-90"
                      )}
                    />
                  )}
                </>
              )}
            </Link>

            {/* Submenu */}
            {(!isCollapsed || isMobile) && item.children && isSubmenuOpen && (
              <div className="ml-4 space-y-1 mt-1">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const isChildActive = pathname === child.href;

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        "hover:bg-gray-100/80",
                        isChildActive
                          ? "bg-blue-50/50 text-blue-600"
                          : "text-gray-600"
                      )}
                      onClick={() => {
                        if (isMobile) {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                    >
                      <ChildIcon
                        className={cn(
                          "h-4 w-4",
                          isChildActive && "text-blue-600"
                        )}
                      />
                      <span className={isChildActive ? "font-medium" : ""}>
                        {child.title}
                      </span>
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
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col transition-all duration-300 fixed top-0 left-0 h-screen bg-white border-r z-40",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-16 items-center px-4 border-b">
            <Link
              href="/"
              className={cn(
                "flex items-center font-bold transition-all duration-300",
                isCollapsed ? "justify-center w-full" : "text-xl"
              )}
            >
                <Image src={dailingo_logo} alt="logo" width={50} height={50} />
             
              {!isCollapsed && <span className="text-gray-900">Dailingo</span>}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute",
                isCollapsed
                  ? "-right-3 h-6 w-6 rounded-full bg-white border shadow-sm hover:bg-gray-50"
                  : "right-2 h-8 w-8 hover:bg-gray-100/80"
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {renderNavigation()}

          {/* User Profile Section */}
          <div className={cn("border-t p-4", isCollapsed ? "px-2" : "px-4")}>
            <div
              className={cn(
                "flex items-center gap-3",
                isCollapsed && "justify-center"
              )}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-1 ring-gray-200">
                <span className="text-sm font-medium text-blue-600">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {session?.user?.email || ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            isCollapsed ? "md:ml-16" : "md:ml-64"
          )}
        >
          {/* Header with Breadcrumb and Profile */}
          <div className="h-16 border-b flex items-center px-4 md:px-8">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-4">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="px-4 py-4 border-b">
                  <SheetTitle className="flex items-center gap-2.5 font-bold text-xl">
                    <Image
                      src={dailingo_logo}
                      alt="logo"
                      width={50}
                      height={50}
                    />

                    <span className="text-gray-900">Dailingo</span>
                  </SheetTitle>
                  <SheetDescription className="text-sm text-gray-500">
                    Navigate through your learning journey
                  </SheetDescription>
                </SheetHeader>
                {renderNavigation(true)}
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 overflow-x-auto">
                {breadcrumbs.map((crumb, index) => (
                  <div
                    key={crumb.href}
                    className="flex items-center whitespace-nowrap"
                  >
                    {index > 0 && (
                      <ChevronRightIcon className="h-4 w-4 mx-2 text-gray-400 flex-shrink-0" />
                    )}
                    <Link
                      href={crumb.href}
                      className={cn(
                        "hover:text-primary transition-colors",
                        index === breadcrumbs.length - 1
                          ? "text-gray-900 font-medium"
                          : ""
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Profile and Streak */}
            <div className="flex items-center space-x-4">
              {/* Streak Display */}
              {streak && (
                <div className="hidden sm:flex items-center gap-1.5 text-orange-600 text-sm bg-orange-50 px-2.5 py-1 rounded-full">
                  <Flame className="h-4 w-4" />
                  <span className="font-medium">{streak.currentStreak}</span>
                </div>
              )}

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session?.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session?.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="w-full cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="w-full cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <QueryProvider>
            <div className="p-4 md:p-8">{children}</div>
          </QueryProvider>
        </main>
      </div>
    </TooltipProvider>
  );
}
