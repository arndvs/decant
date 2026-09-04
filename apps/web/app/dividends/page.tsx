import { Sidebar } from "@/components/sidebar";

export default function DividendsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar current="/dividends" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Dividends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          By year, by account, yield per holding.
        </p>
      </main>
    </div>
  );
}