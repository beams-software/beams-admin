"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useDidUpdateEffect } from "@/hooks/use-didUpdateEffect"
import { useIsMobile } from "@/hooks/use-mobile"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import axios from "axios"
import { useTransitionRouter } from "next-view-transitions"
import React, { useEffect, useState } from "react"

import { z } from "zod"

const voterSchema = z.object({
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
          z.object({ positionId: z.number(), candidateAdmId: z.number() }),
        ),
      })
      .or(z.object({}))
      .default({}),
  }),
});

export function CreateVoterDrawer({
  apiUrl,
  token,
}: {
  apiUrl: string
  token: string
}) {
  const isMobile = useIsMobile()

  const updateFormRef = React.useRef<HTMLFormElement>(null)
  const router = useTransitionRouter()
  const [error, setError] = useState("");
  const [changeVoted, setChangeVoted] = useState(false)
  const [voted, setVoted] = useState("false")
  const [changeAbsent, setChangeAbsent] = useState(false)
  const [absent, setAbsent] = useState("false")
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onClose={() => {
        setChangeVoted(false)
        setVoted("false")
        setChangeAbsent(false)
        setAbsent("false");
        setError("")
      }}
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
    >
      <DrawerTrigger asChild>
        <Button>Create Voter</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Creating Voter</DrawerTitle>
          <DrawerDescription>
            Enter details for the new voter.
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
              { error && <p className="text-destructive">{error}</p>}
              
              <Label htmlFor="voterName">Voter Name</Label>
              <Input id="voterName" name="voterName" required />
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  name="admissionNumber"
                  required
                  type="number"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" name="grade" required type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="house">House</Label>
                <Select required name="house">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select House" />
                  </SelectTrigger>
                  <SelectContent id="house">
                    <SelectItem value="SUMMER">SUMMER</SelectItem>
                    <SelectItem value="WINTER">WINTER</SelectItem>
                    <SelectItem value="SPRING">SPRING</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="class">Class</Label>
                <Input id="class" name="class" required></Input>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="voted">Voted Already?</Label>
                {changeVoted ? (
                  <Select
                    name="voted"
                    defaultValue="false"
                    onValueChange={setVoted}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent id="voted">
                      <SelectItem value="false">NO</SelectItem>
                      <SelectItem value="true">YES</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      setChangeVoted(true)
                    }}
                    type="button"
                  >
                    Change
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="absent">Present/Absent?</Label>
                {changeAbsent ? (
                  <Select
                    name="absent"
                    defaultValue="false"
                    onValueChange={setAbsent}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent id="voted">
                      <SelectItem value="false">PRESENT</SelectItem>
                      <SelectItem value="true">ABSENT</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      setChangeAbsent(true)
                    }}
                    type="button"
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={async () => {
              if (updateFormRef.current) {
                if (updateFormRef.current.reportValidity()) {
                  const formData = new FormData(updateFormRef.current)
                  const admid = formData.get("admissionNumber")
                  const name = formData.get("voterName")
                  const grade = formData.get("grade")
                  const class_ = formData.get("class")
                  const house = formData.get("house")
                  
                  const parsedData = voterSchema.parse({
                    admid,
                    name,
                    grade,
                    class: class_,
                    house,
                    voted,
                    votedInfo: {
                      absent
                    }
                  })
                  console.log(parsedData)
                  const reqdata = await axios.post(`${apiUrl}/admin/voter/createVoter`, parsedData, {
                    headers: {
                      "X-Token": token
                    }
                  });
                  if (reqdata.data.success) {
                    setDrawerOpen(false);
                    router.push(`/voters?successToast=${encodeURIComponent("Created Voter!")}`)
                    // console.log("ok")
                  }else{
                    if (reqdata.data.error.code == "P2002") {
                      setError("Error: Someone with that admission id already exists")
                    }else {
                      setError("Error: Check console.")
                      console.log(reqdata.data)
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
