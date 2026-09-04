"use client"

import { TrendingUp } from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

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

/** Dividend income by account — the income sleeve's payoff view. */
export type DividendByAccountData = {
  account: string
  dividends: number
  fill: string
}

const chartConfig = {
  dividends: { label: "Dividends" },
} satisfies ChartConfig

const DEFAULT_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DividendsByAccount({
  data,
  title = "Dividends by Account",
  description = "Gross dividends received, this year",
}: {
  data: DividendByAccountData[]
  title?: string
  description?: string
}) {
  const total = data.reduce((s, d) => s + d.dividends, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={data} dataKey="dividends" nameKey="account" innerRadius={45}>
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.fill || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {total.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}{" "}
          received
        </div>
        <div className="leading-none text-muted-foreground">
          Sleeve income, before taxes &amp; withholding
        </div>
      </CardFooter>
    </Card>
  )
}