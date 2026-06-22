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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useTransitionRouter } from "next-view-transitions"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from 'zod';
import axios from "axios"

const navBar = getNavBar(NavBarItemType.Dashboard)

const dashboardData = z.object({
  totalVoters: z.number(),
  votedVoters: z.number(),
  totalPositions: z.number(),
  totalCandidates: z.number(),
  votingEnabled: z.boolean()
})

export default function Page() {
  const router = useTransitionRouter()
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null

  useEffect(() => {
    if (!token) {
      router.push("/login")
    }
  }, [token, router])
  

  const dashboardDataQuery = useQuery({
    queryKey: ['getDashboardData'],
    queryFn: () =>
      fetch(`${apiUrl}/admin/misc/dashboardStats`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) =>
        dashboardData.parse(await res.json()),
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
        <div className="m-10 grid grid-flow-col">
          <div className="w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Voters</CardTitle>
                <CardDescription>Total Number of voters: {dashboardDataQuery.data?.totalVoters}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Voted : {dashboardDataQuery.data?.votedVoters}</p>
                <p>Not Voted (including absentees): {dashboardDataQuery.data ? dashboardDataQuery.data.totalVoters - dashboardDataQuery.data.votedVoters : 0}</p>
              </CardContent>
            </Card>
          </div>
          <div className="w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Positions : {dashboardDataQuery.data?.totalPositions}</p>
                <p>Total Candidates : {dashboardDataQuery.data?.totalCandidates}</p>
              </CardContent>
            </Card>
          </div>
          <div className="w-xs">
            <Card>
              <CardHeader>
                <CardTitle>Enable/Disable Voting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row gap-3">
                  <Label htmlFor="enableVoting">Disabled</Label>
                  { 
                  dashboardDataQuery.data &&  
                  <Switch id="enableVoting"
                  onClick={async (e) => {
                    const electionState = e.currentTarget.ariaChecked === "true" ? "false" : "true"
                    await axios.post(`${apiUrl}/admin/misc/votingEnable/${electionState}`, {}, { headers: { "X-Token": token } })
                    dashboardDataQuery.refetch();
                  }}
                  checked={dashboardDataQuery.data.votingEnabled} />
                  }
                  <Label htmlFor="enableVoting">Enabled</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
