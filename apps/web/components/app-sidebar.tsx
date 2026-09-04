"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartPieIcon, CoinsIcon, LandmarkIcon, ScaleIcon, WalletIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const nav = [
  { title: "Portfolio", url: "/", icon: ChartPieIcon },
  { title: "Holdings", url: "/holdings", icon: WalletIcon },
  { title: "Rebalance", url: "/rebalance", icon: ScaleIcon },
  { title: "IRA Plan", url: "/ira", icon: LandmarkIcon },
  { title: "Dividends", url: "/dividends", icon: CoinsIcon },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <span className="text-xl leading-none" aria-hidden="true">
                🍷
              </span>
              <span className="text-base font-semibold">Decant</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          Local-first · lot-level
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
