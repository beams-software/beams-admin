"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getNavBar, NavBarItemType } from "../constants"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { usePositionData } from "../positions/getPositionData"
import { useEffect } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import wcsTemplate from "../wcs.json"
import { Button } from "@/components/ui/button"

const navBar = getNavBar(NavBarItemType.ViewCandidates)

function PositionTable({
  response,
}: {
  response: {
    status: number
    result: {
      id: number
      name: string
      priorityNumber: number
      wcs: string
      _count: {
        candidates: number
      }
    }[]
  }
}) {
  const router = useTransitionRouter();
  return (
  <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25">Position Name</TableHead>
          <TableHead>Which groups can see?</TableHead>
          <TableHead>Number of Candidates</TableHead>
          <TableHead className="text-right">Click to view the candidates</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {response.result.map((position) => (
          <TableRow key={position.id}>
            <TableCell className="font-medium">{position.name}</TableCell>
            <TableCell>{position.wcs.split(";").map((wci) => {
              const wcName = Object.entries(wcsTemplate).find(([key, value]) => value === parseInt(wci))?.[0]
              return <p key={wci}>{wcName}</p>
            })}</TableCell>
            <TableCell>{position._count.candidates}</TableCell>
            <TableCell className="text-right"><Button onClick={() => router.push(`/candidates/${position.id}`)}>View Candidates</Button></TableCell>
            {/* TODO: Check out react tanstack react query */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    )
}

export default function Page() {
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null
  const router = useTransitionRouter()
  useEffect(() => {
    if (!token) {
      router.push("/login")
    }
  }, [token, router])

  const [data, loading, error, setUpdate] = usePositionData(
    apiUrl || "",
    token || ""
  )
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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
                {/* <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem> */}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mt-5">
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
          {data && <div className="mx-6 p-4 border-2 rounded-3xl"><PositionTable response={data} /></div>}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
