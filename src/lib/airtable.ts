import type { HgvResort } from "@/lib/types";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function firstString(fields: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function firstNumber(fields: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = fields[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function airtableConfigured(): boolean {
  return Boolean(env("AIRTABLE_PAT") && env("AIRTABLE_BASE_ID") && env("AIRTABLE_TABLE_NAME"));
}

export async function fetchAirtableResorts(): Promise<HgvResort[]> {
  const pat = env("AIRTABLE_PAT");
  const baseId = env("AIRTABLE_BASE_ID");
  const table = env("AIRTABLE_TABLE_NAME");
  if (!pat || !baseId || !table) {
    throw new Error("Missing Airtable environment variables.");
  }

  const nameKeys = (env("AIRTABLE_FIELD_NAME") ?? "Property Name,Name,Resort,Property,Title")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const locationKeys = (env("AIRTABLE_FIELD_LOCATION") ?? "Location,Destination,Address,Region,City")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const latKeys = (env("AIRTABLE_FIELD_LAT") ?? "Lat,Latitude")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lngKeys = (env("AIRTABLE_FIELD_LNG") ?? "Lng,Longitude,Lon")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const airportKeys = (env("AIRTABLE_FIELD_AIRPORT") ?? "Airport,IATA,Nearest Airport")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const out: HgvResort[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${pat}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable ${res.status}: ${text.slice(0, 400)}`);
    }
    const json = (await res.json()) as {
      records?: { id: string; fields: Record<string, unknown> }[];
      offset?: string;
    };

    for (const rec of json.records ?? []) {
      const f = rec.fields;
      const name = firstString(f, nameKeys) ?? "Unnamed resort";
      const city = firstString(f, ["City"]);
      const stateCountry = firstString(f, ["State/Country", "State", "Country"]);
      const location = firstString(f, locationKeys) ?? [city, stateCountry].filter(Boolean).join(", ");
      const lat = firstNumber(f, latKeys);
      const lng = firstNumber(f, lngKeys);
      const airport = firstString(f, airportKeys);

      out.push({
        id: rec.id,
        name,
        location,
        lat,
        lng,
        airport,
        raw: f,
      });
    }
    offset = json.offset;
  } while (offset);

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
