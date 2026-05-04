import { fetchLocalResorts } from "@/lib/local-resorts";
import type { HgvResort } from "@/lib/types";

export async function fetchResorts(): Promise<{ resorts: HgvResort[]; source: "local-csv" }> {
  return { resorts: await fetchLocalResorts(), source: "local-csv" };
}
