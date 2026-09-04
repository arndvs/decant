import { Sidebar } from "@/components/sidebar";

export default function RebalancePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar current="/rebalance" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Rebalance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Whole-portfolio category weights vs targets, buy/sell gaps, and the income-sleeve
          build-out.
        </p>
      </main>
    </div>
  );
}