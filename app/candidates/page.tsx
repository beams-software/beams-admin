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
import { useEffect } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import wcsTemplate from "../wcs.json"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod";

const navBar = getNavBar(NavBarItemType.ViewCandidates)
const positionDataSchema = z.object({
    status: z.number(),
    error: z.string().optional(),
    result: z.array(z.object({
        id: z.number(),
        name: z.string(),
        priorityNumber: z.number(),
        wcs: z.string(),
        _count: z.object({
            candidates: z.number()
        })
    }))
}); 

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
          </TableRow>
        ))}
      </TableBody>
      {
        response.result.length === 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No positions found.
              </TableCell>
            </TableRow>
          </TableFooter>
        )
      }
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

  // const [data, loading, error, setUpdate] = usePositionData(
  //   apiUrl || "",
  //   token || ""
  // )
  const { isLoading, error, data } = useQuery({
    queryKey: ['getPositions'],
    queryFn: () =>
      fetch(`${apiUrl}/admin/position/getPositions`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) =>
        positionDataSchema.parse(await res.json()),
      ),
  })
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
                  <BreadcrumbPage>Candidates</BreadcrumbPage>
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
          {isLoading && <p>Loading...</p>}
          {error && <p>Error: {error.message}</p>}
          {data && <div className="mx-6 p-4 border-2 rounded-3xl"><PositionTable response={data} /></div>}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
