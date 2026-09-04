"use client"

import { Label, Pie, PieChart } from "recharts"

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

/** Category allocation — current vs target, the rebalance centrepiece. */
export type CategoryAllocationData = {
  category: string
  value: number
  target: number
  fill: string
}

const chartConfig = {
  value: { label: "Current" },
  target: { label: "Target", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig

export function CategoryAllocation({
  data,
  title = "Category Allocation",
  description = "Current vs target mix",
  palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"],
}: {
  data: CategoryAllocationData[]
  title?: string
  description?: string
  palette?: string[]
}) {
  const filled = data.map((d, i) => ({ ...d, fill: d.fill || palette[i % palette.length] }))
  const totalValue = filled.reduce((s, d) => s + d.value, 0)
  const targetTotal = filled.reduce((s, d) => s + d.target, 0)

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
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={filled}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Current value
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Sleeve target {Math.round(targetTotal * 100)}% of portfolio
        </div>
        <div className="leading-none text-muted-foreground">
          Slices: Dividends &amp; Income ETFs, Energy Infrastructure, select miners
        </div>
      </CardFooter>
    </Card>
  )
}