"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"
import wcsData from "../wcs.json"
import { useEffect } from "react"
import axios from "axios"
import { useTransitionRouter } from "next-view-transitions"
import { Trash2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const schema = z.object({
  id: z.number(),
  positionName: z.string(),
  wcs: z.array(z.string()),
  priorityNumber: z.number(),
  numberOfCandidates: z.number(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <IconGripVertical className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    accessorKey: "positionName",
    header: "Position Name",
    cell: ({ row }) => {
      return (
        <>
          <Label
            htmlFor={`${row.original.id}-positionName`}
            className="sr-only"
          >
            Position Name
          </Label>
          <Input
            className="h-8 border-transparent bg-transparent text-left shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
            defaultValue={row.original.positionName}
            disabled
            id={`${row.original.id}-positionName`}
          />
        </>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "wcs",
    header: () => (
      <div className="w-full text-left">Which groups can vote?</div>
    ),
    cell: ({ row }) => (
      <>
        <Label htmlFor={`${row.original.id}-wcs`} className="sr-only">
          Which groups can vote?
        </Label>
        {/* <textarea
          className="h-20 w-full border-transparent bg-transparent text-left shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          id={`${row.original.id}-wcs`}
          disabled
          defaultValue={row.original.wcs.join("\n")}
        >  
        </textarea> */}
        {row.original.wcs.map((wc) => (
          <p key={wc} className="p-1 text-sm">
            {wc}
          </p>
        ))}
      </>
    ),
  },
  {
    accessorKey: "numberOfCandidates",
    header: () => <div className="w-full text-left">Number Of Candidates</div>,
    cell: ({ row }) => (
      <>
        <Label
          htmlFor={`${row.original.id}-numberOfCandidates`}
          className="sr-only"
        >
          Number of Candidates
        </Label>
        <Input
          className="h-8 w-16 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.numberOfCandidates}
          disabled
          id={`${row.original.id}-numberOfCandidates`}
        />
      </>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <>
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
            <DropdownMenuContent
              align="end"
              className="w-32"
              onFocusOutside={(e) => {
                e.preventDefault()
              }}
            >
              <TableCellViewer item={row.original} />
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={() => {}}
                    role="menuitem"
                    data-slot="dropdown-menu-item"
                    data-variant="destructive"
                    className="group/dropdown-menu-item relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive"
                  >
                    <Trash2Icon className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                      <Trash2Icon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete position?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this position.{" "}
                      <span className="font-bold text-destructive">
                        This will also delete all candidates under this position
                        and cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={async () => {
                        const apiUrl =
                          typeof window !== "undefined"
                            ? localStorage.getItem("API_URL")
                            : null

                        const token =
                          typeof window !== "undefined"
                            ? sessionStorage.getItem("token")
                            : null
                        await axios.delete(
                          `${apiUrl}/admin/position/deletePosition/${row.original.id}`,
                          {
                            headers: {
                              "X-Token": `${token}`,
                            },
                          }
                        )
                        window.location.reload();
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
  onPriorityChange,
  apiURL,
  token,
}: {
  data: z.infer<typeof schema>[]
  onPriorityChange?: (data: z.infer<typeof schema>[]) => void
  apiURL: string
  token: string
}) {
  const [data, setData] = React.useState(initialData)
  const [prevData, setPrevData] = React.useState(initialData)
  const [initialized, setInitialized] = React.useState(false)
  const [priorityChanged, setPriorityChanged] = React.useState(false)
  useEffect(() => {
    setData(initialData)
    setInitialized(true)
  }, [initialData])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useDidUpdateEffect(async () => {
    if (initialized) {
      setInitialized(false)
    } else {
      if (data.length > 0) {
        console.log(token)
        console.log("Priority updated:", data)
        console.log("Previous data:", prevData)
        await axios.post(
          `${apiURL}/admin/position/reorderPositions`,
          {
            positions: data.map((item) => {
              return {
                id: item.id,
                priorityNumber: item.priorityNumber,
              }
            }),
          },
          {
            headers: {
              "x-token": token,
            },
          }
        )
        onPriorityChange?.(data)
      }
    }
  }, [data])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        setPrevData(data)
        return arrayMove(data, oldIndex, newIndex)
          .toReversed()
          .map((item, index) => ({
            ...item,
            priorityNumber: index, // Update priority based on new position
          }))
          .toReversed()
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

function TableCellViewer({
  item,
  onOpen,
}: {
  item: z.infer<typeof schema>
  onOpen?: () => void
}) {
  const isMobile = useIsMobile()
  const [wcs, setWcs] = React.useState<string[]>(item.wcs)
  const wcsRef = React.useRef<HTMLTextAreaElement>(null)
  const wcsError = React.useRef<HTMLParagraphElement>(null)
  const [selectedWc, setSelectedWc] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const updateFormRef = React.useRef<HTMLFormElement>(null)
  const router = useTransitionRouter()
  useDidUpdateEffect(() => {
    console.log("WCS updated:", wcs)
    if (wcsRef.current) {
      wcsRef.current.value = wcs.join("\n")
    }
  }, [wcs])
  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onClose={() => {
        if (!submitted) {
          setWcs(item.wcs)
        }
      }}
    >
      <DrawerTrigger asChild>
        <button
          onClick={() => {
            onOpen?.()
          }}
          className="group/dropdown-menu-item relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive"
        >
          Edit
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.positionName}</DrawerTitle>
          <DrawerDescription>
            Editing position {item.positionName}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4" ref={updateFormRef}>
            <div className="flex flex-col gap-3">
              <Label htmlFor="positionName">Position Name</Label>
              <Input
                id="positionName"
                name="positionName"
                defaultValue={item.positionName}
                required
              />
            </div>
            <hr />
            <p className="text-red-600" ref={wcsError}></p>
            <div className="grid grid-cols-[1fr_35px_1fr]">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Which groups can see?</Label>
                <Select onValueChange={setSelectedWc} required={false}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(wcsData).map(([wc, value]) => (
                      <SelectItem key={value} value={wc}>
                        {wc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="mx-1 mt-6 w-7 text-center"
                onClick={(e) => {
                  e.preventDefault()
                  if (selectedWc) {
                    if (!wcs.includes(selectedWc)) {
                      setWcs((prev) => [...prev, selectedWc!])
                      if (wcsError.current) {
                        wcsError.current.textContent = ""
                      }
                    } else {
                      if (wcsError.current) {
                        wcsError.current.textContent = "Group already added"
                      }
                    }
                  }
                }}
              >
                {"->"}
              </Button>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Selected Groups</Label>
                <textarea
                  id="status"
                  className="flex min-h-37.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled
                  defaultValue={wcs.join("\n")}
                  ref={wcsRef}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="h-5"
                onClick={(e) => {
                  e.preventDefault()
                  setWcs([])
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={async () => {
              if (updateFormRef.current) {
                if (updateFormRef.current.reportValidity()) {
                  if (wcs.length != 0) {
                    // console.log(new FormData(updateFormRef.current).get("positionName"), wcs, item.id, item.priorityNumber);
                    
                    const wcsString: string = wcs
                      .map((wc) => wcsData[wc as keyof typeof wcsData])
                      .join(";")
                    const positionName = new FormData(updateFormRef.current)
                      .get("positionName")
                      ?.toString()
                      .trim()
                    console.log(
                      positionName,
                      wcsString,
                      item.id,
                      item.priorityNumber
                    )
                    const apiUrl =
                      typeof window !== "undefined"
                        ? localStorage.getItem("API_URL")
                        : null

                    const token =
                      typeof window !== "undefined"
                        ? sessionStorage.getItem("token")
                        : null
                    await axios.post(
                      `${apiUrl}/admin/position/updatePosition`,
                      {
                        id: item.id,
                        priority: item.priorityNumber,
                        name: positionName,
                        wcs: wcsString,
                      },
                      {
                        headers: {
                          "x-token": token || "",
                        },
                      }
                    )

                    window.location.reload()
                  } else {
                    if (wcsError.current) {
                      wcsError.current.textContent =
                        "At least one group must be selected"
                    }
                  }
                }
              }
            }}
          >
            Submit
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
