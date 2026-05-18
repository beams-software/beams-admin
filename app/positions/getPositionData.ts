"use client"

import axios, { AxiosError, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { z } from "zod";

const positionDataSchema = z.object({
    status: z.number(),
    error: z.string().optional(),
    result: z.array(z.object({
        id: z.number(),
        name: z.string(),
        priorityNumber: z.number(),
        wcs: z.string(),
        _count: z.object({
            candidates: z.number()
        })
    }))
}); 

export function usePositionData(API_URL: string, token: string) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<z.infer<typeof positionDataSchema> | null>(null);
    const router = useTransitionRouter();


    useEffect(() => {
        if (!API_URL || !token) return;

        axios.get(`${API_URL}/admin/position/getPositions`, {
            headers: {
                "x-token": token
            }
        })
        .then((response: AxiosResponse) => {
            setData(positionDataSchema.parse(response.data));
            setLoading(false);
        })
        .catch((err: AxiosError) => {
            setError(err.message);
            setLoading(false);

            if (err.response?.status === 401) {
                sessionStorage.removeItem("token");
                router.push("/login");
            }

            console.error(err);
        });

    }, [API_URL, token, router]);

    return [data, loading, error] as const;
}