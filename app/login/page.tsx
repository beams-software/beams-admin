"use client"
import { LoginForm } from "@/components/login-form"
import { checkToken } from "@/hooks/tokenHooks"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"
import { useTransitionRouter } from "next-view-transitions"
import { useEffect, useState } from "react"
export default function LoginPage() {
  const router = useTransitionRouter()
  const apiUrl = typeof window !== "undefined"
    ? localStorage.getItem("API_URL")
    : null
  var [token, setToken, isTokenValid, isLoading, error, setError, setUpdate] = checkToken(apiUrl || "")
  useDidUpdateEffect(() => {
    if (isTokenValid) {
      sessionStorage.setItem("token", token || "")
      router.push("/dashboard")
    } else {
      setError("Invalid token. Please try again.")
    }
  }, [isTokenValid])
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm className="" onLoginSubmit={(submittedToken) => {
            setToken(submittedToken);
            setUpdate(prev => !prev);
          }}
          error={error}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
