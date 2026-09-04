"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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
 * Position caps dashboard — radar of each position's weight vs its cap.
 * The rebalance "hot spots": anything pushing toward its cap (e.g. LEU
 * at 8.9% vs the 8% household cap) is the forced-distribution candidate.
 */
export type CapRadarData = {
  position: string
  weight: number
  cap: number
}

const chartConfig: ChartConfig = {
  weight: { label: "Current weight", color: "hsl(var(--chart-1))" },
  cap: { label: "Position cap", color: "hsl(var(--chart-2))" },
}

export function PositionCapsRadar({
  data,
  title = "Position Caps",
  description = "Current weight vs household cap (8%)",
}: {
  data: CapRadarData[]
  title?: string
  description?: string
}) {
  const overCap = data.filter((d) => d.weight > d.cap).length

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadarChart data={data}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="position" />
            <PolarGrid />
            <Radar
              dataKey="weight"
              fill="var(--color-weight)"
              fillOpacity={0.4}
              stroke="var(--color-weight)"
            />
            <Radar
              dataKey="cap"
              fill="var(--color-cap)"
              fillOpacity={0.1}
              stroke="var(--color-cap)"
              strokeDasharray="4 4"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          {overCap > 0
            ? `${overCap} position${overCap > 1 ? "s" : ""} over cap`
            : "All positions within cap"}
        </div>
        <div className="flex leading-none text-muted-foreground">
          Dashed ring = household cap; solid = current weight
        </div>
      </CardFooter>
    </Card>
  )
}