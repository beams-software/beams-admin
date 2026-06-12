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
import { getNavBar, NavBarItemType } from "../../constants"
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
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { success, z } from "zod"
import { CreateVoterDrawer } from "../create-voter-drawer"
import { useParams, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"

const navBar = getNavBar(NavBarItemType.ViewVoters)
const classAndCountSchema = z.object({
  status: z.number(),
  result: z.array(
    z.object({
      class: z.string(),
      count: z.number(),
    })
  ),
})

function VotersTableMain({
  data,
  grade
}: {
  data: z.infer<typeof classAndCountSchema>
  grade: number
}) {
  
  const router = useTransitionRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
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
            <Button onClick={() => router.push(`/voters/${grade}/ALL`)}>View Voters</Button>
          </TableCell>
        </TableRow>
        {data.result.map((v) => {
          return (
            <TableRow key={v.class}>
              <TableCell className="font-medium">{v.class}</TableCell>
              <TableCell>{v.count}</TableCell>
              <TableCell>
                <Button onClick={() => router.push(`/voters/${grade}/${v.class}`)}>View Voters</Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default function Page() {

  const params = useParams();

  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null
  const router = useTransitionRouter()

  // const searchParams = useSearchParams();

  // useEffect(() => {
  //   const successMessage = searchParams.get("successToast")
  //   if (successMessage) {
  //     toast.success(successMessage, { position: "top-center" })
  //   }
  // }, [searchParams])

  

  useEffect(() => {
    if (!token) {
      router.push("/login")
    }
  }, [token, router])

  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["getGradesAndCount", params.grade],
    queryFn: () =>
      fetch(`${apiUrl}/admin/voter/getClassesAndCount/${params.grade}`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => classAndCountSchema.parse(await res.json())),
  })

  useEffect(() => {
    if (error) {
      console.error("Error fetching classes and count:", error)
    }
    if (data) {
      console.log("Classes and count data:", data)
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
                  <BreadcrumbPage
                    onClick={() => router.push("/voters")}
                    className="relative cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Voters
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{params.grade}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mx-6 mt-5">
          <div className="flex flex-row gap-2">
            <CreateVoterDrawer apiUrl={apiUrl || ""} token={token || ""} onSubmitSuccess={() => {
              refetch();
              toast.success("Created Voter!", { position: "top-center" })
            }} 
            defaultValues={{
              grade: Number(params.grade)
            }}
            />
            <Button variant="outline" onClick={() => router.push("/createVotersExcel")}>
              Create Voters Via Excel
            </Button>
          </div>
          <div className="mt-3 rounded-3xl border-2 p-4">
            {data && <VotersTableMain data={data} grade={Number(params.grade)} />}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}