import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DOMAttributes, useState } from "react"

export function LoginForm({
  onLoginSubmit,
  error,
  isLoading,
  className,
  ...props
}: {
  onLoginSubmit: (token: string) => void
  error?: string | null
  isLoading: boolean
  className?: string
} & React.ComponentProps<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [token, setToken] = useState("")
  const onFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onLoginSubmit(token)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onFormSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your admin account
                </p>
                {error && (
                  <p className="text-balance text-destructive">{error}</p>
                )}
              </div>
              <Field>
                <FieldLabel htmlFor="token">Token</FieldLabel>
                <Input
                  id="token"
                  type="token"
                  placeholder="Enter your token"
                  required
                  disabled={isLoading}
                  onChange={(e) => {
                    setToken(e.target.value)
                  }}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/beams_2_800x800.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
