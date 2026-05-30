"use client"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getNavBar, NavBarItemType } from "../constants"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { z } from "zod"
import { CreateVoterDrawer } from "./create-voter-drawer"

const navBar = getNavBar(NavBarItemType.ViewVoters)
const gradeAndCountSchema = z.object({
  status: z.number(),
  result: z.array(
    z.object({
      grade: z.number(),
      count: z.number(),
    })
  ),
})

function VotersTableMain({
  data,
}: {
  data: z.infer<typeof gradeAndCountSchema>
}) {
  const funData = [{grade: 1, count:10}, {grade: 2, count:100}]
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Grade</TableHead>
          <TableHead>Number of voters</TableHead>
          <TableHead>Click to view</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">ALL</TableCell>
          <TableCell>
            {data.result.reduce((sum, current) => sum + current.count, 0)}
          </TableCell>
          <TableCell>
            <Button>View Voters</Button>
          </TableCell>
        </TableRow>
        {data.result.map((v) => {
          return (
            <TableRow key={v.grade}>
              <TableCell className="font-medium">{v.grade}</TableCell>
              <TableCell>
                {v.count}
              </TableCell>
              <TableCell>
                <Button>View Voters</Button>
              </TableCell>
            </TableRow>
          )
        })}
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
  const { isLoading, error, data } = useQuery({
    queryKey: ["getGradesAndCount"],
    queryFn: () =>
      fetch(`${apiUrl}/admin/voter/getGradesAndCount`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => gradeAndCountSchema.parse(await res.json())),
  })
  useEffect(() => {
    if (error) {
      console.error("Error fetching grades and count:", error)
    }
    if (data) {
      console.log("Grades and count data:", data)
    }
  }, [error, data])
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
                  <BreadcrumbPage>Voters</BreadcrumbPage>
                </BreadcrumbItem>
                {/* <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem> */}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mx-6 mt-5">
          <div className="flex flex-row gap-2">
            <CreateVoterDrawer apiUrl={apiUrl || ""}  token={token || ""}/>
            <Button variant="outline">Create Voter Via Excel</Button>
          </div>
          <div className="mt-3 rounded-3xl border-2 p-4">
            {data && <VotersTableMain data={data} />}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
