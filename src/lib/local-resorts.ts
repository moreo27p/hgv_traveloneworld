import { readFile } from "node:fs/promises";
import path from "node:path";
import { guessDestinationIata } from "@/lib/airports";
import type { HgvResort } from "@/lib/types";

const LOCAL_CSV = path.join(process.cwd(), "public", "data", "hgv-properties.csv");

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }

  cells.push(current);
  return cells;
}

function cleanCell(value: string | undefined): string {
  return (value ?? "").replace(/\?{2,}/g, "").trim();
}

export async function fetchLocalResorts(): Promise<HgvResort[]> {
  const csv = await readFile(LOCAL_CSV, "utf8");
  const [headerLine, ...rows] = csv.split(/\r?\n/).filter((line) => line.trim());
  const headers = parseCsvLine(headerLine).map(cleanCell);

  return rows
    .map((line, index) => {
      const cells = parseCsvLine(line);
      const raw = Object.fromEntries(headers.map((header, i) => [header, cleanCell(cells[i])]));
      const name = raw["Property Name"] || raw.Name || "Unnamed resort";
      const city = raw.City ?? "";
      const stateCountry = raw["State/Country"] ?? "";
      const region = raw.Region ?? "";
      const location = [city, stateCountry].filter(Boolean).join(", ");
      const airport = guessDestinationIata(name, location);

      return {
        id: `local-${index + 1}`,
        name,
        location: location || region,
        lat: null,
        lng: null,
        airport,
        raw,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
