"use client"

import type { ReactNode } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

/** Realized gains by account — the phantom-loss-vs-gains story. */
export type RealizedByAccountData = {
  account: string
  realized: number
  longTerm: number
  shortTerm: number
}

const chartConfig = {
  realized: { label: "Realized", color: "hsl(var(--chart-1))" },
  longTerm: { label: "Long-term", color: "hsl(var(--chart-2))" },
  shortTerm: { label: "Short-term", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function RealizedByAccount({
  data,
  title = "Realized Gains by Account",
  description = "Tax lots closed this year",
  totalLabel = "Total realized (YTD)",
}: {
  data: RealizedByAccountData[]
  title?: string
  description?: string
  totalLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.realized, 0)
  const up = total >= 0

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-10 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0">
            <span className="text-xs text-muted-foreground">{totalLabel}</span>
            <span
              className={`text-lg font-bold leading-none ${
                up ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {up ? "+" : ""}
              {total.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="account"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.replace("Inh ", "")}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="realized" fill="var(--color-realized)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}