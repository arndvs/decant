import { Sidebar } from "@/components/sidebar";

export default function DividendsPage() {
  return (
    <Sidebar>
      <main>
        <h1 className="text-2xl font-semibold">Dividends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          By year, by account, yield per holding.
        </p>
      </main>
    </Sidebar>
  );
}