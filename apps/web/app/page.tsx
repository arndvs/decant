import { Sidebar } from "@/components/sidebar";

export default function PortfolioPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar current="/" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Market value, cash, top holdings, and the income-sleeve gap. Charts land here
          (shadcn area + pie) once the engines are wired.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total Value" value="—" />
          <Metric label="Cash" value="—" />
          <Metric label="Realized Gains" value="—" />
          <Metric label="Income Sleeve" value="—" />
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}