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
import { io, Socket } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { useTransitionRouter } from "next-view-transitions"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import ChartForLifeFeed from "./live-feed-chart"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const navBar = getNavBar(NavBarItemType.ViewLiveFeed)

const submitVoteSockerSchema = z.object({
  admid: z.number(),
  votedComputer: z.string(),
})

export const LiveFeedVoterStatsSchema = z.array(
  z.tuple([
    z.string(),
    z.array(
      z.object({
        key: z.string(),
        value: z.number(),
        realValue: z.number(),
        total: z.number(),
      })
    ),
  ])
)

export const PositionResultsSchema = z.array(
  z.object({
    id: z.number(),
    priorityNumber: z.number(),
    name: z.string(),
    wcs: z.string(),

    candidates: z.array(
      z.object({
        admid: z.number(),
        name: z.string(),
        grade: z.number(),
        house: z.string(),
        startingVotes: z.number(),
        photo: z.string(),
        positionId: z.number(),

        _count: z.object({
          votes: z.number(),
        }),
      })
    ),
  })
)

export default function Page() {
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null

  const router = useTransitionRouter()

  const [showCandidates, setShowCandidates] = useState(false)

  const {
    isLoading,
    error,
    data: chartLiveFeedData,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["liveFeedVoterStats"],
    queryFn: () =>
      fetch(`${apiUrl}/admin/voter/liveFeedVoterStats`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => LiveFeedVoterStatsSchema.parse(await res.json())),
    refetchInterval: 1000 * 60,
  })

  const {
    isLoading: isLoadingPos,
    error: errorPos,
    data: resultData,
    refetch: refetchResult,
  } = useQuery({
    queryKey: ["liveFeedPositionData"],
    queryFn: () =>
      fetch(`${apiUrl}/admin/position/liveFeedPositionData`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => PositionResultsSchema.parse(await res.json())),
    refetchInterval: 1000 * 60,
  })

  const [submitVoteArray, setSubmitVoteArray] = useState<
    z.infer<typeof submitVoteSockerSchema>[]
  >([])

  useEffect(() => {
    if (!token) {
      router.push("/login")
    }
  }, [token, router])

  const socketRef = useRef<Socket | null>(null)
  useEffect(() => {
    socketRef.current = io(apiUrl || "")

    socketRef.current.on("connect", () => {
      console.log("Connected")
    })

    socketRef.current.on("submitted-vote", (d) => {
      const data = submitVoteSockerSchema.parse(d)

      setSubmitVoteArray((prev) => {
        const next = [data, ...prev]

        if (next.length > 50) {
          next.pop()
        }

        return next
      })
    })

    return () => {
      socketRef.current?.off("submitted-vote")
      socketRef.current?.disconnect()
    }
  }, [])

  useEffect(() => {
    console.log(chartLiveFeedData)
  }, [chartLiveFeedData])

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
                  <BreadcrumbPage>Live Feed</BreadcrumbPage>
                </BreadcrumbItem>
                {/* <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem> */}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="grid w-full place-items-center gap-2 p-5">
          <p>Live feed</p>
          <textarea
            className="h-50 w-[75%] self-center bg-black/20"
            disabled
            value={submitVoteArray
              .map(
                (e) =>
                  `Voter with admission id ${e.admid} voted at computer "${e.votedComputer}"`
              )
              .join("\n")}
          />
        </div>
        <div className="flex flex-row gap-10 self-center">
          <div className="self-center">
            <Button variant={"outline"} onClick={() => {refetchChart(); refetchResult()}}>
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="airplane-mode">Voters</Label>
            <Switch
              id="airplane-mode"
              onClick={() => {setShowCandidates((p) => !p); refetchChart(); refetchResult()}}
            />
            <Label htmlFor="airplane-mode">Candidates</Label>
          </div>
          <div className="self-center">
            <Button variant={"outline"} onClick={typeof window !== "undefined" ? window.print : () => {}}>Print</Button>
          </div>
        </div>
        {!showCandidates ? (
          <>
            <p className="self-center pt-2 text-xs text-muted-foreground">
              Voted/Total Voters:
            </p>
            <div className="grid grid-cols-4">
              {chartLiveFeedData?.map((p) => {
                return (
                  <div key={p[0]} className="size-[105%]">
                    <p className="text-center text-xs text-muted-foreground">
                      {p[0]}
                    </p>
                    <ChartForLifeFeed chartRawData={p} />
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {resultData?.map((p) => {
              return (
                <div key={p.id} className="my-5">
                  <hr />
                  <p className="mx-12 mt-5">Position : {p.name}</p>
                  <div className="mx-10 my-3 rounded-2xl border-2 p-5">
                    <Table className="">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name (Admission Number)</TableHead>
                          <TableHead>Photo</TableHead>
                          <TableHead>Votes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {p.candidates.map((c) => {
                          return (
                            <TableRow key={c.admid}>
                              <TableCell>
                                {c.name} (Adm id: {c.admid})
                              </TableCell>
                              <TableCell>
                                <img
                                  src={`${apiUrl}/static/candidates/${c.photo}`}
                                  alt="Candidate Photo"
                                  className="h-35 min-w-25 object-cover"
                                />
                              </TableCell>
                              <TableCell>
                                {c.startingVotes + c._count.votes}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
