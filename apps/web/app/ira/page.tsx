import { Sidebar } from "@/components/sidebar";

export default function IraPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar current="/ira" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">IRA Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The sort facility: sell inside (free) vs distribute in kind, ordered by expected
          upside, against the 2031 deadline.
        </p>
      </main>
    </div>
  );
}