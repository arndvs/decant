"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

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

/** A single position's value over time — LEU home in on cap, etc. */
export type PositionValueData = {
  month: string
  value: number
}

const chartConfig = {
  value: { label: "Value", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function PositionValueTrend({
  data,
  title = "Position Value",
  description = "Market value, last 12 months",
  ticker,
}: {
  data: PositionValueData[]
  title?: string
  description?: string
  ticker?: string
}) {
  const last = data[data.length - 1]?.value ?? 0
  const first = data[0]?.value ?? 0
  const delta = last - first
  const pct = first !== 0 ? (delta / first) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ticker ? `${ticker} — ${title}` : title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {last.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })}{" "}
              current value
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}