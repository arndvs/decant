import Link from "next/link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Portfolio" },
  { href: "/holdings", label: "Holdings" },
  { href: "/rebalance", label: "Rebalance" },
  { href: "/ira", label: "IRA Plan" },
  { href: "/dividends", label: "Dividends" },
];

export function Sidebar({ current }: { current?: string }) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r px-3 py-4">
      <div className="px-2 pb-4 text-lg font-semibold">Decant</div>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            current === item.href && "bg-accent text-accent-foreground font-medium"
          )}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}