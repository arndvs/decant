import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
export * from "./engines/realized.js";
export * from "./engines/acb.js";
export * from "./engines/dividends.js";

/** The SQLite file lives in the repo's data/ (gitignored). */
export function createDb(path = process.env.DECANT_DB ?? "./data/decant.db") {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };