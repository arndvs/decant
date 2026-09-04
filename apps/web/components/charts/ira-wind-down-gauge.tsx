"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

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
 * IRA wind-down gauge — progress toward emptying the inherited IRA by the
 * 2031 deadline. `goal` = 100 (empty), value = remaining distribution need.
 * Also serves the meaningful-progress reading: the tranche plan pulls
 * positions that are over cap *and* satisfy the mandatory distribution.
 */
export type IraProgressData = {
  value: number
  goal?: number
  label: string
}

const chartConfig = {
  progress: { label: "Distribution progress", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function IraWindDownGauge({
  data,
  title = "IRA Wind-Down",
  description = "Progress toward the 2031 mandatory distribution",
}: {
  data: IraProgressData
  title?: string
  description?: string
}) {
  const goal = data.goal ?? 100
  const pct = Math.min(100, Math.max(0, (data.value / goal) * 100))

  return (
    <Card className="flex flex-col" style={{ animationDelay: "0.1s" }}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart
            data={[{ name: data.label, value: pct, fill: "var(--color-progress)" }]}
            startAngle={90}
            endAngle={-270}
            innerRadius="70%"
            outerRadius="85%"
            cx="50%"
            cy="50%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <RadialBar dataKey="value" background cornerRadius={999} fillOpacity={1} />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {pct.toFixed(1)}% toward {goal === 100 ? "empty" : goal} by 2031
        </div>
        <div className="leading-none text-muted-foreground">
          Tranches: ~20% of the over-cap positions per year
        </div>
      </CardFooter>
    </Card>
  )
}