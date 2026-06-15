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
import { useTransitionRouter } from "next-view-transitions"
import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image"

const navBar = getNavBar(NavBarItemType.ViewVoters)

enum UploadStatus {
  Idle,
  FileSelected,
  Uploading,
  Success,
  HeaderError,
  ParsingError,
  ConflictError,
  ConflictWithinExcelFile,
  UnknownError,
}

interface Voter {
  admid: number
  name: string
  grade: number
  house: string
  class: string
  voted: boolean
  votedInfo: object
}

interface Conflicts {
  uploadedRow: Voter
  existingRow: Voter
}

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

  const [status, setStatus] = useState<UploadStatus>(UploadStatus.Idle)
  const [fileName, setFileName] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [zodError, setZodError] = useState("");
  const [conflicts, setConflicts] = useState<Conflicts[] | null>(null)
  const renderInside = (statusOfUpload: UploadStatus) => {
    switch (statusOfUpload) {
      case UploadStatus.Idle:
        return (
          <>
            <Input
              type="file"
              //   accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                console.log(file)
                if (file) {
                  setFileName(file.name)
                  setFile(file)
                  setStatus(UploadStatus.FileSelected)
                }
              }}
            />
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 h-12 w-12 text-muted-foreground transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-lg font-semibold">Upload Excel File</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Click to browse or drag and drop
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Supports .xlsx and .xls files
              </p>
            </>
            <p className="my-2 text-sm">Example : </p>
            <Image
              src="/ExcelExamplePicture.png"
              width={647}
              height={296}
              alt="Excel Example Picture"
            />
            <a href="./ExcelExample.xlsx" download="ExcelExample">
              <Button variant={"outline"} className="mt-4">
                Download Example File
              </Button>
            </a>
            <p className="font-bold text-destructive mt-2">Rules:</p>
            <code className="whitespace-break-spaces">
              1. The first row of the spreadsheet should EXACTLY match the one given in the image. {"\n"}
              2. Only 1 sheet is allowed in the spreadsheet. {"\n"}
              3. .xlsx file is recommended. {"\n"}
              4. It is recommended to upload only 1 file per grade. {"\n"}
              <strong className="text-destructive">VALUE RULES:</strong> {"\n"}
              admid - This must be a NUMBER. The number is UNIQUE to every voter. No duplicates are allowed  {"\n"}
              name  - This can be alphanumeric, there are no restrictions.  {"\n"}
              grade - This must be a NUMBER. It can ONLY RANGE FROM 3 to 12.  {"\n"}
              class - This can be alphanumeric, recommended to keep it short.  {"\n"}
              house - This must be only <strong>WINTER or SUMMER or SPRING</strong> . Lowercase is not allowed {"\n"}
              <strong className="text-destructive">IF THE DATA DOES NOT FOLLOW THE RULES THEN THERE WILL BE ERRORS!</strong>
            </code>
          </>
        )
      case UploadStatus.Uploading:
        return <Spinner />
      case UploadStatus.FileSelected:
        return (
          <>
            <p className="text-sm text-muted-foreground">{fileName}</p>
            <Button
              variant="outline"
              type="button"
              className="mt-2"
              onClick={async () => {
                setStatus(UploadStatus.Uploading)
                const res = await axios.post(
                  `${apiUrl}/admin/voter/createMultipleVoters`,
                  {
                    file: file,
                  },
                  {
                    headers: {
                      "X-Token": token,
                      "Content-Type": "multipart/form-data",
                    },
                  }
                )

                if (res.status === 200) {
                  if (res.data.status === 200) {
                    setStatus(UploadStatus.Success)
                    setZodError(res.data.result)
                  } else if (res.data.status === 401) {
                    setConflicts(res.data.conflicts)
                    setStatus(UploadStatus.ConflictError)
                  }else if (res.data.status === 500 && res.data.error.code === "P2002") {
                    setStatus(UploadStatus.ConflictWithinExcelFile)
                  }else if (res.data.status === 402){
                    setZodError(res.data.error.message);
                    setStatus(UploadStatus.ParsingError)
                    console.log(res.data)
                  }else {
                    console.log(res.data)
                  }
                }
              }}
            >
              Upload {"->"}
            </Button>
          </>
        )
      case UploadStatus.ConflictError:
        return (
          <>
            <p>Conflicts found</p>
            <div className="m-5 flex flex-row gap-5">
              <div className="flex flex-col">
                <p className="text-center text-sm text-muted-foreground">
                  Excel Table
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>House</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflicts?.map((conflict) => {
                      return (
                        <TableRow key={conflict.uploadedRow.admid}>
                          <TableCell>{conflict.uploadedRow.admid}</TableCell>
                          <TableCell>{conflict.uploadedRow.name}</TableCell>
                          <TableCell>{conflict.uploadedRow.grade}</TableCell>
                          <TableCell>{conflict.uploadedRow.class}</TableCell>
                          <TableCell>{conflict.uploadedRow.house}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col">
                <p className="text-center text-sm text-muted-foreground">
                  Existing Voters
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adm ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>House</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conflicts?.map((conflict) => {
                      return (
                        <TableRow key={conflict.existingRow.admid}>
                          <TableCell>{conflict.existingRow.admid}</TableCell>
                          <TableCell>{conflict.existingRow.name}</TableCell>
                          <TableCell>{conflict.existingRow.grade}</TableCell>
                          <TableCell>{conflict.existingRow.class}</TableCell>
                          <TableCell>{conflict.existingRow.house}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <Button onClick={() => {}}>
              Re-Upload <Spinner />
            </Button>
          </>
        )
      case UploadStatus.HeaderError:
        return (
          <>
            <p>The Header of the file is not according to the format given!</p>
            <Button onClick={() => {window.location.reload()}}>
              Re-Upload <Spinner />
            </Button>
          </>
        )
      case UploadStatus.ConflictWithinExcelFile:
        return (
          <>
          <p>There are conflicting admission ids inside the excel file itself!</p>
          <Button onClick={() => {window.location.reload()}}>
              Re-Upload <Spinner />
          </Button>
          </>
        )
      case UploadStatus.ParsingError:
        return (
          <>
          <p>Please check all the values in the excel sheet. They do not follow the rules mentioned.</p>
          <Button onClick={() => {window.location.reload()}}>
              Re-Upload <Spinner />
          </Button>
          <code className="whitespace-pre">
            {JSON.stringify(JSON.parse(zodError), null, 4)}
          </code>
          </>
        )
      case UploadStatus.UnknownError:
        return (
          <>
          <p>Unknow Error Try again!</p>
          <Button onClick={() => {window.location.reload()}}>
              Re-Upload <Spinner />
          </Button>
          </>
        )
      case UploadStatus.Success:
        return (
          <>
          <p>Uploaded Successfully!</p>
          <Button onClick={() => {window.location.reload()}}>
              Re-Upload <Spinner />
          </Button>
          <code className="whitespace-pre">
            {zodError}
          </code>
          </>
        )  
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
                  <BreadcrumbPage
                    onClick={() => router.push("/voters")}
                    className="relative cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Voters
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create Voters By Excel</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex justify-center p-8">
          <label className="group flex w-auto cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-10 transition-all hover:border-primary hover:bg-muted">
            {renderInside(status)}
          </label>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
