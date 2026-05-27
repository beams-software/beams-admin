"use client"

import { getNavBar, NavBarItemType } from "@/app/constants"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { useQuery } from "@tanstack/react-query"
import { useTransitionRouter } from "next-view-transitions"
import { useParams } from "next/navigation"
import { z } from "zod"
import { CreateCandidateDrawer } from "./create-candidate-drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2Icon } from "lucide-react"

const navBar = getNavBar(NavBarItemType.ViewCandidates)

export const CandidateSchema = z.object({
  name: z.string(),
  admid: z.number(),
  grade: z.number(),
  house: z.string(),
  votes: z.number(),
  photo: z.string(),
  positionId: z.number(),
})

export const PositionSchema = z.object({
  candidates: z.array(CandidateSchema),
  name: z.string(),
  id: z.number(),
  priorityNumber: z.number(),
  wcs: z.string(),
})

const getPositionInfoDataSchema = z.object({
  status: z.number(),
  error: z.string().optional(),
  result: z.union([PositionSchema, z.string()]),
})

function CandidateTable({
  data,
  apiUrl,
  token,
}: {
  data: z.infer<typeof CandidateSchema>[]
  apiUrl: string
  token: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Admission Number</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>House</TableHead>
          <TableHead>Votes (click to reveal)</TableHead>
          <TableHead>Photo</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((candidate) => (
          <TableRow key={candidate.admid}>
            <TableCell>{candidate.name}</TableCell>
            <TableCell>{candidate.admid}</TableCell>
            <TableCell>{candidate.grade}</TableCell>
            <TableCell>{candidate.house}</TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  if (e.currentTarget.textContent?.startsWith("Reveal")) {
                    e.currentTarget.textContent =
                      "Votes: " + String(candidate.votes)
                  } else {
                    e.currentTarget.textContent = "Reveal"
                  }
                }}
              >
                Reveal
              </Button>
            </TableCell>
            <TableCell>
              <img
                src={`${apiUrl}/static/candidates/${candidate.photo}`}
                alt="Candidate Photo"
                className="h-35 min-w-25 object-cover"
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2 w-[75%]">
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" /> 
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Page() {
  const params = useParams()
  const router = useTransitionRouter()
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null

  const { isLoading, error, data } = useQuery({
    queryKey: ["positionData", params.position_id],
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/admin/position/getPositionInfo/${params.position_id}`,
        {
          headers: {
            "X-Token": `${token}`,
          },
        }
      )
      const result = getPositionInfoDataSchema.parse(await response.json())
      return result
    },
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
                  <BreadcrumbPage
                    onClick={() => router.push("/candidates")}
                    className="cursor-pointer hover:underline"
                  >
                    Candidates
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Candidates for{" "}
                    {data?.result && typeof data.result !== "string"
                      ? <strong>{data.result.name}</strong>
                      : "..."}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="mt-5">
          {isLoading && "Loading..."}
          {error && `Error: ${error.message}`}
          {data && typeof data.result === "string" && `Error: ${data.result}`}
          <CreateCandidateDrawer
            apiUrl={apiUrl || ""}
            token={token || ""}
            nameOfPosition={
              data?.result && typeof data.result !== "string"
                ? data.result.name
                : "..."
            }
            positionId={
              data?.result && typeof data.result !== "string"
                ? data.result.id
                : -1
            }
          />
          {(() => {
            if (data && typeof data.result !== "string") {
              return (
                <>
                  <div className="mx-6 rounded-3xl border-2 p-4">
                    <CandidateTable
                      data={data.result.candidates}
                      apiUrl={apiUrl || ""}
                      token={token || ""}
                    />
                  </div>

                  <pre>{JSON.stringify(data.result, null, 2)}</pre>
                </>
              )
            }
          })()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
