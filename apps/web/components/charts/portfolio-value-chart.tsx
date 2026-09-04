"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

/** Portfolio value over time (7/30/90 day & year ranges). */
export type PortfolioValuePoint = {
  date: string
  value: number
}

const chartConfig = {
  value: { label: "Portfolio value", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
] as const

export function PortfolioValueChart({
  data,
  title = "Portfolio Value",
  description = "Market value over time, all accounts",
}: {
  /** Ascending by date */
  data: PortfolioValuePoint[]
  title?: string
  description?: string
}) {
  const [activeRange, setActiveRange] = React.useState<(typeof RANGES)[number]>(
    RANGES[1]
  )

  const sliced = React.useMemo(() => {
    if (!data.length) return []
    const end = data[data.length - 1].date
    const cutoff = new Date(end)
    cutoff.setDate(cutoff.getDate() - activeRange.days)
    return data.filter((p) => new Date(p.date) >= cutoff)
  }, [data, activeRange])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setActiveRange(r)}
              className={`relative z-10 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 ${
                activeRange.label === r.label
                  ? "bg-muted/50 text-foreground"
                  : "text-muted-foreground hover:bg-muted/20"
              }`}
            >
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={sliced}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="value"
              type="natural"
              fill="var(--color-value)"
              fillOpacity={0.1}
              stroke="var(--color-value)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}