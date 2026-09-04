"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
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

/** Portfolio vs S&P 500 benchmark — the perf engine's headline chart. */
export type BenchmarkedValueData = {
  month: string
  portfolio: number
  benchmark: number
}

const chartConfig = {
  portfolio: { label: "Decant", color: "hsl(var(--chart-1))" },
  benchmark: { label: "S&P 500", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export function PortfolioVsBenchmark({
  data,
  title = "Portfolio vs S&P 500",
  description = "Indexed total return, last 12 months",
  precision = 1,
}: {
  data: BenchmarkedValueData[]
  title?: string
  description?: string
  /** decimal places for the % labels */
  precision?: number
}) {
  const last = data[data.length - 1]
  const first = data[0]
  const delta = last && first ? last.portfolio - first.portfolio : 0
  const pct = first && last && first.portfolio !== 0 ? (delta / first.portfolio) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="portfolio"
              type="monotone"
              stroke="var(--color-portfolio)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="benchmark"
              type="monotone"
              stroke="var(--color-benchmark)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {pct >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(precision)}% over {data.length} months
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Benchmarked against S&amp;P 500 total return
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}