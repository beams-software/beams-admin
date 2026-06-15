"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A radial chart with a label"

type FinalResultItem = [
  string,
  {
    key: string;
    value: number;
    realValue: number;
    total: number;
  }[]
];

const chartData = [
  {
    key: "chrome",
    value: 100,
    fill: "var(--color-chrome)",
    realValue: 312,
    total: 312,
  },
  {
    key: "safari",
    value: 90,
    fill: "var(--color-safari)",
    realValue: 312,
    total: 312,
  },
  {
    key: "firefox",
    value: 80,
    fill: "var(--color-firefox)",
    realValue: 312,
    total: 312,
  },
  {
    key: "edge",
    value: 75,
    fill: "var(--color-edge)",
    realValue: 312,
    total: 312,
  },
  {
    key: "other",
    value: 50,
    fill: "var(--color-other)",
    realValue: 312,
    total: 312,
  },
  {
    key: "kay",
    value: 50,
    fill: "var(--color-kay)",
    realValue: 45,
    total:312
  },
  {
    key: "gay",
    value: 50,
    fill: "var(--color-gay)",
    realValue: 45,
    total:312
  }
]

const chartConfig = {
  value: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-3)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-3)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-3)",
  },
  other: {
    label: "Other",
    color: "var(--chart-3)",
  },
  kay: {
    label: "kay",
    color: "var(--chart-3)",
  },
  gay: {
    label: "gay",
    color: "var(--chart-3)",
  }
} satisfies ChartConfig

export default function ChartForLifeFeed({chartRawData} : {chartRawData: FinalResultItem}) {
    const [label, stats] = chartRawData;

const chartData = stats.map((item) => ({
  ...item,
  fill: `var(--chart-3)`,
}));

const chartConfig = {
  value: {
    label,
  },
  ...Object.fromEntries(
    stats.map((item) => [
      item.key,
      {
        label: item.key,
        color: "var(--chart-3)",
      },
    ])
  ),
} satisfies ChartConfig;

    console.log(chartData, chartConfig)
  return (
    
      
        <ChartContainer
          config={chartConfig}
          className="mx-auto "
        >
          <RadialBarChart
            data={chartData}
            startAngle={-90}
            endAngle={270}
            
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="key"
                  formatter={(a, b, c, d, e) => {
                    const data = JSON.parse(JSON.stringify(e))
                    return (
                      <>
                        <div className="flex flex-row gap-2">
                          <div
                            className={`h-2.5 w-2.5 mt-0.5 shrink-0 rounded-xs`}
                            style={{ border: data.fill, background: data.fill }}
                          ></div>
                          <div className="flex flex-1 items-center justify-between leading-none">
                            <div className="grid gap-1.5">
                              <span className="text-muted-foreground">
                                {data.key}
                              </span>
                            </div>
                            <span className="font-sm font-mono text-foreground tabular-nums mx-2">
                              {data.realValue}/{data.total}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  }}
                />
              }
            />
            <RadialBar dataKey="value" background>
              <LabelList
                position="insideStart"
                dataKey="key"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
     
  )
}
