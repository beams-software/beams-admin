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
import { getNavBar, NavBarItemType } from "../../../constants"
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
import axios from "axios"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CircleAlert, Trash2Icon } from "lucide-react"
import { useParams } from "next/navigation"
import { CreateVoterDrawer } from "../../create-voter-drawer"
import { toast } from "sonner"

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
  grade,
 class: className
}: {
  apiUrl: string | null
  token: string | null
  grade: number
  class: string
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const selectAllRef = useRef<HTMLInputElement>(null)

  const { isLoading, error, data, refetch: refetchVoters } = useQuery({
    queryKey: ["getVoters", grade, className],
    queryFn: () =>
      fetch(`${apiUrl}/admin/voter/getVotersByClassAndGrade/${grade}/${className}`, {
        headers: {
          "X-Token": `${token}`,
        },
      }).then(async (res) => VotersResponseSchema.parse(await res.json())),
  })

  const rows =
    data?.result.map((voter) => ({
      admid: voter.admid,
      name: voter.name,
      grade: voter.grade,
      class: voter.class,
      house: voter.house,
      voted: voter.voted ? "VOTED" : "NOT VOTED",
      absent: voter.votedInfo.absent ? "ABSENT" : "PRESENT",
    })) ?? []

  const listOfClasses = data
    ? Array.from(new Set(data.result.map((voter) => voter.class)))
        .map((className) => ({
          label: className,
          value: className,
        }))
    : []

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
      width: "14%",
      filterable: true,
      type: "string",
      isSortable: true,
    },
    {
      accessor: "grade",
      label: "Grade",
      width: "10%",
      filterable: true,
      type: "number",
      isSortable: true,
    },
     {
      accessor: "class",
      label: "Class",
      width: "10%",
      filterable: true,
      type: "enum",
      enumOptions: listOfClasses,
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

  const handleMarkAbsent = async () => {
    console.log("Marking absent:", Array.from(selectedRows))
    const admids = Array.from(selectedRows).map((id) => Number(id))

    await axios.post(`${apiUrl}/admin/voter/markAbsent`, {
      admids}, {
      headers: {
        "X-Token": `${token}`,
      },
    });

    setSelectedRows(new Set());
    refetchVoters();
  }

  const handleMarkPresent = async () => {
    console.log("Marking present:", Array.from(selectedRows))
    const admids = Array.from(selectedRows).map((id) => Number(id))

    await axios.post(`${apiUrl}/admin/voter/markPresent`, { admids }, {
      headers: {
        "X-Token": `${token}`,
      },
    });

    setSelectedRows(new Set());
    refetchVoters();
  }

  const handleInvalidateVotes = async () => {
    console.log("Invalidating votes for:", Array.from(selectedRows))
    const admids = Array.from(selectedRows).map((id) => Number(id))

    await axios.post(`${apiUrl}/admin/voter/deleteVotes`, { admids }, {
      headers: {
        "X-Token": `${token}`,
      },
    });

    setSelectedRows(new Set());
    refetchVoters();
  }

  const handleDeleteVoters = async () => {
    console.log("Deleting voters:", Array.from(selectedRows))
    const admids = Array.from(selectedRows).map((id) => Number(id))

    await axios.post(`${apiUrl}/admin/voter/deleteVoters`, { admids }, {
      headers: {
        "X-Token": `${token}`,
      },
    });

    setSelectedRows(new Set());
    refetchVoters();
  }

  return (
    <>
        <div className="">
            <CreateVoterDrawer apiUrl={apiUrl || ""} token={token || ""} onSubmitSuccess={() => {
              refetchVoters();
              toast.success("Created Voter!", { position: "top-center" })
            }} defaultValues={{grade, class: className}}/>
        </div>
      {data ? (
        <div className="flex flex-col">
          <div className="mb-2 flex flex-row gap-2">
            <p className="text-sm text-muted-foreground self-center">
              {selectedRows.size} voter(s) selected
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={selectedRows.size === 0}>
                  Mark Absent
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <CircleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Mark Absent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark {selectedRows.size} selected voter(s) as absent.{" "}
                      <span className="font-bold text-destructive">
                        This will also invalidate their votes if they have voted.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleMarkAbsent}
                    >
                      Mark Absent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <Button variant="outline" onClick={async () => await handleMarkPresent()} disabled={selectedRows.size === 0}>
              Mark Present
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={selectedRows.size === 0}>
                  Invalidate Votes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <CircleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Invalidate Votes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will invalidate {selectedRows.size} selected voter(s)' votes.{" "}
                      <span className="font-bold text-destructive">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleInvalidateVotes}
                    >
                      Invalidate Votes
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={selectedRows.size === 0}>
                  Delete Voters
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <CircleAlert />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete Votes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will also delete the votes of {selectedRows.size} selected voter(s) aswell as their voter records.{" "}
                      <span className="font-bold text-destructive">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDeleteVoters}
                    >
                      Delete Voters
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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

  const params = useParams();

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
                  <BreadcrumbPage
                    onClick={() => router.push(`/voters/${params.grade}`)}
                    className="relative cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {params.grade}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{decodeURIComponent(params.class as string)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="m-5">
          <AllVoterTable apiUrl={apiUrl} token={token} grade={Number(params.grade)} class={String(params.class)} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
