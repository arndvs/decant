import { Sidebar } from "@/components/sidebar";

export default function RebalancePage() {
  return (
    <Sidebar>
      <main>
        <h1 className="text-2xl font-semibold">Rebalance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Whole-portfolio category weights vs targets, buy/sell gaps, and the income-sleeve
          build-out.
        </p>
      </main>
    </Sidebar>
  );
}