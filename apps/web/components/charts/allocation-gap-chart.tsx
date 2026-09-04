"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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

/** Allocation gap by category — how far current is from target. */
export type AllocationGapData = {
  category: string
  gap: number
}

const chartConfig = {
  gap: { label: "Gap (current − target)", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function AllocationGapChart({
  data,
  title = "Allocation Gap",
  description = "Current weight minus target, per category",
}: {
  data: AllocationGapData[]
  title?: string
  description?: string
}) {
  const positive = data.filter((d) => d.gap > 0).reduce((s, d) => s + d.gap, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              width={150}
              tickMargin={8}
            />
            <XAxis dataKey="gap" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="gap"
              radius={4}
              fill="var(--color-gap)"
              maxBarSize={28}
            >
              <LabelList
                dataKey="gap"
                position="right"
                formatter={(label) => {
                  const v = Number(label)
                  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`
                }}
                className="fill-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {positive.toFixed(1)}% needs rebalancing downward
        </div>
        <div className="leading-none text-muted-foreground">
          Positive = overweight (sell candidate); negative = underweight (buy)
        </div>
      </CardFooter>
    </Card>
  )
}