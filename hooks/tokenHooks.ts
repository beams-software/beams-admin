import { Dispatch, SetStateAction, useEffect, useState } from "react"
import axios from "axios"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"

export function checkToken(prefixUrl: string): [string | null, (token: string | null) => void, boolean | null, boolean , string | null, Dispatch<SetStateAction<string | null>>, Dispatch<SetStateAction<boolean>>] {
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ update , setUpdate ] = useState(false);
  useDidUpdateEffect(() => {
    setIsLoading(true)
    axios
      .get(`${prefixUrl}/admin/token/check`, {
        headers: {
          "X-Token": token,
        },
      })
      .then((response : { data: { result: boolean, status: number } }) => {
        setIsTokenValid(response.data.result)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setIsLoading(false)
        setToken(null)
      })
  }, [update])

  return [token, setToken, isTokenValid, isLoading, error, setError, setUpdate]
}