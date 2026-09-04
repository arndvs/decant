import { Sidebar } from "@/components/sidebar";

export default function HoldingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar current="/holdings" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Holdings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sortable data table (TanStack) over the ledger — qty, ACB, per-share, MV.
        </p>
      </main>
    </div>
  );
}