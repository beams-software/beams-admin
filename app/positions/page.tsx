"use client"

import { useEffect, useState } from "react"
import { useTransitionRouter } from "next-view-transitions"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

import { Separator } from "@/components/ui/separator"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { getNavBar, NavBarItemType } from "../constants"
import { DataTable, schema } from "@/app/positions/date-table"
import { usePositionData } from "./getPositionData"
import { z } from "zod"
import wcsTemplate from "../wcs.json"
import { CreatePositionDrawer } from "./create-position-drawer"

const navBar = getNavBar(NavBarItemType.ViewPositions)

export const dataTableSchema = z.array(schema)
export default function Page() {
  const [dateTableData, setDateTableData] = useState<
    z.infer<typeof dataTableSchema>
  >([])

  const [copy, setCopy] = useState<z.infer<typeof dataTableSchema>>([])

  const router = useTransitionRouter()
  const wcsStringSchema = z.string().transform((str) => {
    const numbers = str.split(";").map((num) => parseInt(num.trim()))
    var wcs: string[] = []
    numbers.forEach((num) => {
      Object.entries(wcsTemplate).forEach(([key, value]) => {
        if (value === num) {
          wcs.push(key)
        }
      })
    })
    return wcs
  })
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null

  var dataCopy: z.infer<typeof dataTableSchema> = []

  useEffect(() => {
    if (!token) {
      router.push("/login")
    }
  }, [token, router])

  const [data, loading, error, setUpdate] = usePositionData(
    apiUrl || "",
    token || ""
  )

  useEffect(() => {
    console.log("Data updated:", data)
    if (data) {
      var _dateTableData: z.infer<typeof dataTableSchema> = []
      data.result.forEach((position) => {
        const nw = wcsStringSchema.parse(position.wcs)
        _dateTableData.push({
          id: position.id,
          positionName: position.name,
          priorityNumber: position.priorityNumber,
          wcs: nw,
          numberOfCandidates: position._count.candidates,
        })
      })
      setDateTableData(_dateTableData)
      setCopy(_dateTableData)
    }
  }, [data])

  return (
    <SidebarProvider>
      <AppSidebar data={navBar} />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />

            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>Positions</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="mt-5">
          <CreatePositionDrawer data={copy} apiUrl={apiUrl || ""} token={token || ""} />
          {/* <Separator className="mb-4" /> */}
          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && (
            <DataTable
              data={dateTableData}
              apiURL={apiUrl || ""}
              token={token || ""}
              onPriorityChange={setCopy}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
