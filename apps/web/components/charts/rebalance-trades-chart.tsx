"use client"

import { TrendingUp } from "lucide-react"
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

/**
 * Rebalance trades — the planned buys/sells per account from the tranche plan.
 * Positive = buy, negative = sell. This is the actionable output of the
 * Rebalance engine (Slice 3): not "where we are" but "what to do".
 */
export type RebalanceTradeData = {
  account: string
  amount: number
}

const chartConfig = {
  buy: { label: "Buy", color: "hsl(var(--chart-2))" },
  sell: { label: "Sell", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function RebalanceTradesChart({
  data,
  title = "Planned Rebalance",
  description = "Proposed buys/sells per account",
}: {
  data: RebalanceTradeData[]
  title?: string
  description?: string
}) {
  const net = data.reduce((s, d) => s + d.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar
              dataKey="amount"
              radius={4}
              className="fill-[var(--color-buy)]"
              // Negative bars render below axis; positive above (recharts handles it)
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4" />
          Net {net >= 0 ? "buy" : "sell"} of{" "}
          {Math.abs(net).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="leading-none text-muted-foreground">
          Drives the trade ticket in the broker
        </div>
      </CardFooter>
    </Card>
  )
}