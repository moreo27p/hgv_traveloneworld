export type OsmPoi = { name: string; type: string; lat: number; lon: number };

const TYPE_LABELS: Record<string, string> = {
  aquarium: "Aquarium",
  arts_centre: "Arts",
  attraction: "Attraction",
  beach_resort: "Beach",
  gallery: "Gallery",
  historic: "Historic",
  museum: "Museum",
  park: "Park",
  theme_park: "Theme park",
  viewpoint: "Viewpoint",
  water_park: "Water park",
  zoo: "Zoo",
};

function labelFor(tags: Record<string, string> | undefined): string {
  const value =
    tags?.tourism ??
    tags?.historic ??
    tags?.leisure ??
    tags?.amenity ??
    tags?.natural ??
    "place";
  return TYPE_LABELS[value] ?? value.replaceAll("_", " ");
}

export async function fetchTourismNearby(lat: number, lon: number, radiusM = 30000): Promise<OsmPoi[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium"](around:${radiusM},${lat},${lon});
      way["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium"](around:${radiusM},${lat},${lon});
      relation["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park|aquarium"](around:${radiusM},${lat},${lon});
      node["historic"](around:${radiusM},${lat},${lon});
      way["historic"](around:${radiusM},${lat},${lon});
      relation["historic"](around:${radiusM},${lat},${lon});
      node["leisure"~"park|water_park|beach_resort|nature_reserve"](around:${radiusM},${lat},${lon});
      way["leisure"~"park|water_park|beach_resort|nature_reserve"](around:${radiusM},${lat},${lon});
      relation["leisure"~"park|water_park|beach_resort|nature_reserve"](around:${radiusM},${lat},${lon});
      node["amenity"="arts_centre"](around:${radiusM},${lat},${lon});
      way["amenity"="arts_centre"](around:${radiusM},${lat},${lon});
    );
    out center 80;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    elements?: {
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  };

  const out: OsmPoi[] = [];
  for (const el of json.elements ?? []) {
    const name = el.tags?.name;
    if (!name) continue;
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (plat == null || plon == null) continue;
    out.push({
      name,
      type: labelFor(el.tags),
      lat: plat,
      lon: plon,
    });
  }
  return dedupeByName(out).slice(0, 24);
}

function dedupeByName(items: OsmPoi[]): OsmPoi[] {
  const seen = new Set<string>();
  const res: OsmPoi[] = [];
  for (const it of items) {
    const k = it.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    res.push(it);
  }
  return res;
}
