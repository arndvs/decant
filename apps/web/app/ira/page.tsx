import { Sidebar } from "@/components/sidebar";

export default function IraPage() {
  return (
    <Sidebar>
      <main>
        <h1 className="text-2xl font-semibold">IRA Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The sort facility: sell inside (free) vs distribute in kind, ordered by expected
          upside, against the 2031 deadline.
        </p>
      </main>
    </Sidebar>
  );
}