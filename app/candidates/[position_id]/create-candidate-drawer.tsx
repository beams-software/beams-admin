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

export function CreateCandidateDrawer({
  apiUrl,
  token,
  nameOfPosition,
  positionId,
}: {
  apiUrl: string
  token: string
  nameOfPosition: string
  positionId: number
}) {
  const isMobile = useIsMobile()

  const updateFormRef = React.useRef<HTMLFormElement>(null)
  const router = useTransitionRouter()

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

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      onClose={() => {
        setImage("")
      }}
    >
      <DrawerTrigger asChild>
        <Button className="mb-3 ml-6">Create Candidate</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Creating Candidate</DrawerTitle>
          <DrawerDescription>
            Enter details for the new candidate for the position "
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
              <Input id="candidateName" name="candidateName" required />
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
                <Label htmlFor="startingVotes">Starting Votes</Label>
                <Input
                  id="startingVotes"
                  name="startingVotes"
                  required
                  type="number"
                  defaultValue="0"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Label htmlFor="candidateImage">Candidate Image</Label>
              <Input
                ref={imageRef}
                onChange={handleImageChange}
                required
                type="file"
                id="candidateImage"
                name="candidateImage"
                accept="image/*"
                className="file:mr-4 cursor-pointer file:rounded-full file:border-0 file:px-4 file:font-semibold file:bg-primary file:text-primary-foreground file:hover:bg-primary/80"
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
                  const photo = imageRef.current?.files?.[0]
                  const data = new FormData()

                  data.append("admid", String(admid))
                  data.append("grade", String(grade))
                  data.append("name", String(name))
                  data.append("house", String(house))
                  data.append("votes", String(votes))
                  data.append("positionId", String(positionId))

                  if (photo) {
                    data.append("photo", photo)
                  }

                  await axios.post(
                    `${apiUrl}/admin/candidate/createCandidate`,
                    data,
                    {
                      headers: {
                        "X-Token": `${token}`,
                        "Content-Type": "multipart/form-data",
                      },
                    }
                  )
                  window.location.reload()
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
