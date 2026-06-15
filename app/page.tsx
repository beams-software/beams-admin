"use client"

import { useTransitionRouter } from "next-view-transitions"
import { useEffect } from "react"

export default function Page() {
    const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null
  const router = useTransitionRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return;
    }

    if (apiUrl) {
      if (token) {
        router.push("/dashboard")
      }
    }
  }, [token, router, apiUrl])
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">API URL NOT SET</h1>
        </div>
      </div>
    </div>
  )
}
