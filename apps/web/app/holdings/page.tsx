import { Sidebar } from "@/components/sidebar";

export default function HoldingsPage() {
  return (
    <Sidebar>
      <main>
        <h1 className="text-2xl font-semibold">Holdings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sortable data table (TanStack) over the ledger — qty, ACB, per-share, MV.
        </p>
      </main>
    </Sidebar>
  );
}