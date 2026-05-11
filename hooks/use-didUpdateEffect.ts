import { useEffect, useRef } from "react"

export function useDidUpdateEffect(effect: () => void, deps: any[]) {
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    effect()
  }, deps)
}