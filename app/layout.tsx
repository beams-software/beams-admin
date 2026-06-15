"use client"
import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ViewTransitions } from "next-view-transitions"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const queryClient = new QueryClient()

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: import("@tanstack/query-core").QueryClient
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (typeof window !== "undefined") {
    window.__TANSTACK_QUERY_CLIENT__ = queryClient
  }
  return (
    <ViewTransitions>
      <QueryClientProvider client={queryClient}>
        <html
          lang="en"
          suppressHydrationWarning
          className={cn(
            "antialiased",
            fontMono.variable,
            "font-sans",
            inter.variable
          )}
        >
          <body>
            <Suspense fallback={<div>Loading...</div>}>
              <ThemeProvider>
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster />
              </ThemeProvider>
            </Suspense>
          </body>
        </html>
      </QueryClientProvider>
    </ViewTransitions>
  )
}
