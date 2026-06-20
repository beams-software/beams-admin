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
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { Spinner } from "@/components/ui/spinner"

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
  const [isExporting, setIsExporting] = useState(false)
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
  function columnWidthToPixels(width: number) {
    return Math.floor((width + 0.75) * 8)
  }

  function rowHeightToPixels(height: number) {
    return Math.floor((height * 96) / 72)
  }
  const handleExportExcel = async () => {
    if (!resultData) return
    setIsExporting(true)
    try {
      const workbook = new ExcelJS.Workbook()

      for (const position of resultData) {
        const sheet = workbook.addWorksheet(`${position.id}`)

        // Title
        sheet.mergeCells("A1:E1")
        sheet.getCell("A1").value = position.name

        // Headers
        sheet.addRow(["Admission ID", "Name", "Grade", "Photo", "Votes"])
        sheet.columns = [
          { width: 15 }, // Admission ID
          { width: 25 }, // Name
          { width: 10 }, // Grade
          { width: 15 }, // Photo
          { width: 10 }, // Votes
        ]
        sheet.getCell("A1").alignment = {
          horizontal: "center",
          vertical: "middle",
        }

        sheet.getCell("A1").font = {
          bold: true,
          size: 16,
        }
        sheet.views = [
          {
            state: "frozen",
            ySplit: 2,
          },
        ]
        let row = 3

        for (const candidate of position.candidates) {
          sheet.addRow([
            candidate.admid,
            candidate.name,
            candidate.grade,
            "",
            candidate.startingVotes + candidate._count.votes,
          ])

          sheet.getRow(row).height = 80

          try {
            const response = await fetch(
              `${apiUrl}/static/candidates/${candidate.photo}`
            )

            const buffer = await response.arrayBuffer()

            const blob = new Blob([buffer])

            const img = new Image()

            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = reject

              img.src = URL.createObjectURL(blob)
            })

            const maxSize = 75

            const scale = Math.min(maxSize / img.width, maxSize / img.height)

            const columnWidth = sheet.getColumn(4).width ?? 8.43
            const rowHeight = sheet.getRow(row).height ?? 15

            const cellWidthPx = columnWidthToPixels(columnWidth)
            const cellHeightPx = rowHeightToPixels(rowHeight)

            const imageWidth = img.width
            const imageHeight = img.height

            // const scale = Math.min(
            //   cellWidthPx / imageWidth,
            //   cellHeightPx / imageHeight
            // )

            const width = imageWidth * scale
            const height = imageHeight * scale

            const xOffsetPx = (cellWidthPx - width) / 2
            const yOffsetPx = (cellHeightPx - height) / 2

            const contentType = response.headers.get("content-type")

            const extension = contentType === "image/png" ? "png" : "jpeg"

            const imageId = workbook.addImage({
              buffer: buffer,
              extension: extension, // see note below
            })

            sheet.addImage(imageId, {
              tl: {
                col: 3 + xOffsetPx / cellWidthPx,
                row: row - 1 + yOffsetPx / cellHeightPx,
              },
              ext: {
                width,
                height,
              },
            })
          } catch (err) {
            console.error(`Failed to load image for ${candidate.name}`, err)
          }
          const currentRow = sheet.getRow(row)

          currentRow.alignment = {
            vertical: "middle",
            horizontal: "center",
          }
          row++
        }
      }

      const excelBuffer = await workbook.xlsx.writeBuffer()

      saveAs(new Blob([excelBuffer]), `Election Results.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

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
            <Button
              variant={"outline"}
              onClick={() => {
                refetchChart()
                refetchResult()
              }}
            >
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="airplane-mode">Voters</Label>
            <Switch
              id="airplane-mode"
              onClick={() => {
                setShowCandidates((p) => !p)
                refetchChart()
                refetchResult()
              }}
            />
            <Label htmlFor="airplane-mode">Candidates</Label>
          </div>
          <div className="self-center">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting && <Spinner />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
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
