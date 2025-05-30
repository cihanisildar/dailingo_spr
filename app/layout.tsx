import type { Metadata } from "next";
import "@/app/globals.css";
import { Quicksand } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import AuthProvider from "../components/providers/session-provider";
import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const quicksand = Quicksand({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Repeeker - Learn Vocabulary Effectively",
  description:
    "Master vocabulary with scientifically-proven spaced repetition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-white dark:bg-slate-900 font-sans antialiased",
        quicksand.className
      )}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" />
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
