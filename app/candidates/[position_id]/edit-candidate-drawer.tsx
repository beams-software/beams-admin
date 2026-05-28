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
import { Pencil } from "lucide-react"

export function EditCandidateDrawer({
  apiUrl,
  token,
  nameOfPosition,
  positionId,
  candidate,
}: {
  apiUrl: string
  token: string
  nameOfPosition: string
  positionId: number
  candidate: {
    name: string
    admid: number
    grade: number
    house: string
    votes: number
    photo: string
    positionId: number
  }
}) {
  const isMobile = useIsMobile()
  const updateFormRef = React.useRef<HTMLFormElement>(null)
  const router = useTransitionRouter()
  const [changeVotes, setChangeVotes] = useState(false)
  const [image, setImage] = useState("")
  const imageRef = React.useRef<HTMLInputElement>(null)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const reader = new FileReader()

    reader.onloadend = () => {
      setImage(reader.result as string) // This is the Base64 string
    }

    if (file) {
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (image) return

    const reader = new FileReader()

    reader.onloadend = () => {
      setImage(reader.result as string)
    }

    fetch(`${apiUrl}/static/candidates/${candidate.photo}`)
      .then((res) => res.blob())
      .then((blob) => {
        reader.readAsDataURL(blob)
      })
  }, [image, apiUrl, candidate.photo])

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onClose={() => {
        setImage("")
        setChangeVotes(false)
      }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Editing Candidate</DrawerTitle>
          <DrawerDescription>
            Edit details for the candidate "{candidate.name}" for the position "
            {nameOfPosition}".
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
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input
                id="candidateName"
                name="candidateName"
                required
                defaultValue={candidate.name}
              />
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
                  defaultValue={candidate.admid}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  name="grade"
                  required
                  type="number"
                  defaultValue={candidate.grade}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="house">House</Label>
                <Select required name="house" defaultValue={candidate.house}>
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
                <Label htmlFor="startingVotes">Votes</Label>
                {changeVotes ? (
                  <>
                    <Input
                      id="startingVotes"
                      name="startingVotes"
                      required
                      type="number"
                      defaultValue={String(candidate.votes)}
                      hidden={!changeVotes}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setChangeVotes(true)}
                    >
                      Change Votes
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Label htmlFor="candidateImage">Candidate Image</Label>
              <Input
                ref={imageRef}
                onChange={handleImageChange}
                type="file"
                id="candidateImage"
                name="candidateImage"
                accept="image/*"
                className="cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:font-semibold file:text-primary-foreground file:hover:bg-primary/80"
              />
            </div>
            {image && (
              <img
                src={image}
                alt="Preview"
                className="h-45 w-full object-contain"
              />
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={async () => {
              if (updateFormRef.current) {
                if (updateFormRef.current.reportValidity()) {
                  const formData = new FormData(updateFormRef.current)
                  const admid = formData.get("admissionNumber")
                  const grade = formData.get("grade")
                  const name = formData.get("candidateName")
                  const house = formData.get("house")
                  const votes = formData.get("startingVotes")
                  const photo = new File(
                    [await fetch(image).then((res) => res.blob())],
                    candidate.photo
                  )
                  const data = new FormData()

                  data.append("admid", String(admid))
                  data.append("grade", String(grade))
                  data.append("name", String(name))
                  data.append("house", String(house))
                  data.append("votes", String(votes))
                  data.append("positionId", String(positionId))
                  data.append("changeVote", String(changeVotes))
                  data.append("photo", photo)

                  await axios.post(
                    `${apiUrl}/admin/candidate/updateCandidate`,
                    data,
                    { headers: { "X-Token": token } }
                  )

                  // console.log(Object.fromEntries(data.entries()))
                  window.location.reload()
                }
              }
            }}
          >
            Edit
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
