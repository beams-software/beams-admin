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
import { useTransitionRouter } from "next-view-transitions"
import { useEffect, useMemo, useRef, useState } from "react"
import { ReactHeaderObject, SimpleTable } from "@simple-table/react"
import { IconDotsVertical } from "@tabler/icons-react"
import "@simple-table/react/styles.css"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

const navBar = getNavBar(NavBarItemType.ViewVoters)

const VoterSchema = z.object({
  admid: z.coerce.number(),
  name: z.coerce.string(),
  grade: z.coerce.number(),
  house: z.enum(["WINTER", "SUMMER", "SPRING"]),
  class: z.coerce.string(),
  voted: z.stringbool().default(false).or(z.boolean().default(false)),
  votedInfo: z.object({
    createdAt: z.string().default(() => new Date().toISOString()),
    editedAt: z.string().default(() => new Date().toISOString()),
    absent: z.stringbool().default(false).or(z.boolean().default(false)),
    votingData: z
      .object({
        votedAt: z.string(),
        votedComputer: z.string(),
        toWho: z.array(
          z.object({ positionId: z.number(), candidateAdmId: z.number() })
        ),
      })
      .or(z.object({}))
      .default({}),
  }),
})

const VotersResponseSchema = z.object({
  status: z.number(),
  error: z.string().optional(),
  result: z.array(VoterSchema),
})

const AllVoterTable = ({
  apiUrl,
  token,
}: {
  apiUrl: string | null
  token: string | null
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const selectAllRef = useRef<HTMLInputElement>(null)

  const { isLoading, error, data } = useQuery({
    queryKey: ["getVoters"],
    queryFn: () =>
      fetch(`${apiUrl}/admin/voter/getDetailedVoters`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => VotersResponseSchema.parse(await res.json())),
  })

  const rows =
    data?.result.map((voter) => ({
      admid: voter.admid,
      name: voter.name,
      grade_class: `${voter.grade}-${voter.class}`,
      house: voter.house,
      voted: voter.voted ? "VOTED" : "NOT VOTED",
      absent: voter.votedInfo.absent ? "ABSENT" : "PRESENT",
    })) ?? []

  useEffect(() => {
    if (error) {
      console.error("Error fetching voters:", error)
    }
  }, [error, data])

  const headers: ReactHeaderObject[] = [
    {
      accessor: "selector",
      label: "",
      width: "4%",
      headerRenderer: () => (
        <input
          className="ml-2"
          ref={selectAllRef}
          type="checkbox"
          onChange={(e) => {
            setSelectedRows(
              e.target.checked
                ? new Set(rows.map((r) => String(r.admid)))
                : new Set()
            )
          }}
        />
      ),
      cellRenderer: (r) => (
        <input
          type="checkbox"
          checked={selectedRows.has(r.row.admid ? r.row.admid.toString() : "")}
          onChange={(e) => {
            setSelectedRows((prev) => {
              const newSet = new Set(prev)
              if (e.target.checked) {
                newSet.add(r.row.admid ? r.row.admid.toString() : "")
              } else {
                newSet.delete(r.row.admid ? r.row.admid.toString() : "")
              }
              return newSet
            })
          }}
        />
      ),
    },
    {
      accessor: "admid",
      label: "Admission Number",
      width: "19%",
      filterable: true,
      type: "number",
      isSortable: true,
    },
    {
      accessor: "name",
      label: "Name",
      width: "19%",
      filterable: true,
      type: "string",
      isSortable: true,
    },
    {
      accessor: "grade_class",
      label: "Grade-Class",
      width: "15%",
      filterable: true,
      type: "string",
      isSortable: true,
    },
    {
      accessor: "house",
      label: "House",
      width: "10%",
      filterable: true,
      type: "enum",
      enumOptions: [
        { label: "WINTER", value: "WINTER" },
        { label: "SUMMER", value: "SUMMER" },
        { label: "SPRING", value: "SPRING" },
      ],
      isSortable: true,
    },
    {
      accessor: "voted",
      label: "Voted?",
      width: "11%",
      filterable: true,
      type: "enum",
      enumOptions: [
        { label: "VOTED", value: "VOTED" },
        { label: "NOT VOTED", value: "NOT VOTED" },
      ],
      isSortable: true,
    },
    {
      accessor: "absent",
      label: "Absent?",
      width: "12%",
      filterable: true,
      type: "enum",
      enumOptions: [
        { label: "ABSENT", value: "ABSENT" },
        { label: "PRESENT", value: "PRESENT" },
      ],
      isSortable: true,
    },
    {
      accessor: "actions",
      label: "Actions",
      width: "10%",
      cellRenderer: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <IconDotsVertical />

              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            {r.row.absent === "ABSENT" ? (
              <DropdownMenuItem
                onClick={(e) => {
                  console.log(r.row.admid)
                }}
              >
                Mark Present
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  console.log(r.row.admid)
                }}
              >
                Mark Absent
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
  useEffect(() => {
    if (!selectAllRef.current) return

    const el = selectAllRef.current

    el.checked = rows.length > 0 && selectedRows.size === rows.length
    el.indeterminate = selectedRows.size > 0 && selectedRows.size < rows.length
  }, [selectedRows, rows.length])

  return (
    <>
      {data ? (
        <div className="flex flex-col">
          <div className="mb-2 flex flex-row gap-2">
            <p className="text-sm text-muted-foreground self-center">
              {selectedRows.size} voter(s) selected
            </p>
            <Button variant="outline">Mark Absent</Button>
            <Button variant="outline">Mark Present</Button>
            <Button variant="destructive">Delete</Button>
          </div>
          <SimpleTable
            defaultHeaders={headers}
            columnResizing
            columnReordering
            useOddEvenRowBackground
            rows={rows}
            theme={"dark"}
            shouldPaginate
            rowsPerPage={15}
          />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">Loading...</div>
      )}
    </>
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
                  <BreadcrumbPage>ALL</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="m-5">
          <AllVoterTable apiUrl={apiUrl} token={token} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
