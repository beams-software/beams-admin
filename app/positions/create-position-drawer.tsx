"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"
import { useIsMobile } from "@/hooks/use-mobile"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import axios from "axios"
import { useTransitionRouter } from "next-view-transitions"
import React, { useEffect, useState } from "react"
import wcsData from "../wcs.json"
import { dataTableSchema } from "./page"
import { z } from "zod"

export function CreatePositionDrawer({
  onOpen,
  data,
  apiUrl,
  token,
}: {
  onOpen?: () => void
  data: z.infer<typeof dataTableSchema>
  apiUrl: string
  token: string
}) {
  const [leastPriorityNumber, setLeastPriorityNumber] = useState(0)

  const isMobile = useIsMobile()
  const [wcs, setWcs] = React.useState<string[]>([])
  const wcsRef = React.useRef<HTMLTextAreaElement>(null)
  const wcsError = React.useRef<HTMLParagraphElement>(null)
  const [selectedWc, setSelectedWc] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const updateFormRef = React.useRef<HTMLFormElement>(null)
  const router = useTransitionRouter()
  useDidUpdateEffect(() => {
    console.log("WCS updated:", wcs)
    if (wcsRef.current) {
      wcsRef.current.value = wcs.join("\n")
    }
  }, [wcs])
  useEffect(() => {
    if (!data) return

    let least = 0

    data.forEach((position) => {
      if (least >= position.priorityNumber) {
        least = position.priorityNumber - 1
      }
    })
    setLeastPriorityNumber(least)
  }, [data])
  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onClose={() => {
        if (!submitted) {
          setWcs([])
        }
      }}
    >
      <DrawerTrigger asChild>
        <Button
          onClick={() => {
            onOpen?.()
            console.log("Current least priority number:", leastPriorityNumber)
          }}
          className="mb-3 ml-6"
        >
          Create Position
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Creating Position</DrawerTitle>
          <DrawerDescription>
            Enter details for the new position
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4" ref={updateFormRef}>
            <div className="flex flex-col gap-3">
              <Label htmlFor="positionName">Position Name</Label>
              <Input id="positionName" name="positionName" required />
            </div>
            <hr />
            <p className="text-red-600" ref={wcsError}></p>
            <div className="grid grid-cols-[1fr_35px_1fr]">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Which groups can see?</Label>
                <Select onValueChange={setSelectedWc} required={false}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(wcsData).map(([wc, value]) => (
                      <SelectItem key={value} value={wc}>
                        {wc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="mx-1 mt-6 w-7 text-center"
                onClick={(e) => {
                  e.preventDefault()
                  if (selectedWc) {
                    if (!wcs.includes(selectedWc)) {
                      setWcs((prev) => [...prev, selectedWc!])
                      if (wcsError.current) {
                        wcsError.current.textContent = ""
                      }
                    } else {
                      if (wcsError.current) {
                        wcsError.current.textContent = "Group already added"
                      }
                    }
                  }
                }}
              >
                {"->"}
              </Button>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Selected Groups</Label>
                <textarea
                  id="status"
                  className="flex min-h-37.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                  defaultValue={wcs.join("\n")}
                  ref={wcsRef}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="h-5"
                onClick={(e) => {
                  e.preventDefault()
                  setWcs([])
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={async () => {
              if (updateFormRef.current) {
                if (updateFormRef.current.reportValidity()) {
                  if (wcs.length != 0) {
                    // console.log(new FormData(updateFormRef.current).get("positionName"), wcs, item.id, item.priorityNumber);

                    console.log({
                      priority: leastPriorityNumber,
                      name: new FormData(updateFormRef.current).get(
                        "positionName"
                      ),
                      wcs: wcs,
                    })
                    const wcsString: string = wcs
                      .map((wc) => wcsData[wc as keyof typeof wcsData])
                      .join(";")
                    await axios.post(
                      `${apiUrl}/admin/position/createPosition`,
                      {
                        name: new FormData(updateFormRef.current)
                          .get("positionName")
                          ?.toString()
                          .trim(),
                        wcs: wcsString,
                        priority: leastPriorityNumber,
                      },
                      {
                        headers: {
                          "X-Token": `${token}`,
                        },
                      }
                    )

                    window.location.reload()
                  } else {
                    if (wcsError.current) {
                      wcsError.current.textContent =
                        "At least one group must be selected"
                    }
                  }
                }
              }
            }}
          >
            Submit
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
