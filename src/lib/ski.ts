import skiRegions from "@/data/ski-regions.json";
import type { SkiIntel } from "@/lib/types";

type RegionRow = {
  skiResorts: string[];
  ikon: boolean | null;
  epic: boolean | null;
  notes: string | null;
};

const regions = skiRegions as Record<string, RegionRow>;

const SKI_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "alta": { lat: 40.5888, lon: -111.6373 },
  "aspen highlands": { lat: 39.1824, lon: -106.8564 },
  "aspen mountain": { lat: 39.1865, lon: -106.8183 },
  "aspen snowmass": { lat: 39.2084, lon: -106.9492 },
  "beaver creek": { lat: 39.6042, lon: -106.5165 },
  "big sky resort": { lat: 45.285, lon: -111.401 },
  "breckenridge": { lat: 39.4817, lon: -106.0384 },
  "brighton": { lat: 40.598, lon: -111.5832 },
  "buttermilk": { lat: 39.2056, lon: -106.8606 },
  "copper mountain": { lat: 39.5022, lon: -106.1497 },
  "deer valley resort": { lat: 40.6374, lon: -111.4783 },
  "heavenly": { lat: 38.9353, lon: -119.9395 },
  "jackson hole mountain resort": { lat: 43.5875, lon: -110.8279 },
  "keystone": { lat: 39.6072, lon: -105.9439 },
  "kirkwood": { lat: 38.6848, lon: -120.0652 },
  "lee canyon": { lat: 36.309, lon: -115.678 },
  "mammoth mountain": { lat: 37.6308, lon: -119.0326 },
  "northstar": { lat: 39.2746, lon: -120.1218 },
  "northstar california": { lat: 39.2746, lon: -120.1218 },
  "palisades tahoe": { lat: 39.1969, lon: -120.2354 },
  "park city": { lat: 40.6514, lon: -111.508 },
  "park city mountain": { lat: 40.6514, lon: -111.508 },
  "sierra-at-tahoe": { lat: 38.8006, lon: -120.0804 },
  "snowbird": { lat: 40.581, lon: -111.6556 },
  "snowmass": { lat: 39.2084, lon: -106.9492 },
  "solitude": { lat: 40.62, lon: -111.5919 },
  "stowe mountain resort": { lat: 44.5297, lon: -72.7815 },
  "telluride ski resort": { lat: 37.9369, lon: -107.8467 },
  "vail": { lat: 39.6061, lon: -106.355 },
  "whistler blackcomb": { lat: 50.1163, lon: -122.9574 },
  "woodward park city": { lat: 40.7587, lon: -111.5873 },
};

function skiCoordinatesForName(name: string): { lat: number; lon: number } | null {
  const normalized = name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
  return SKI_COORDINATES[normalized] ?? null;
}

function distanceKmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const radiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return radiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function estimatedDrive(origin: { lat: number; lon: number }, destination: { lat: number; lon: number }) {
  const straightLineKm = distanceKmBetween(origin, destination);
  const distanceKm = Math.max(2, Math.round(straightLineKm * 1.35));
  const driveMinutes = Math.max(8, Math.round((distanceKm / 55) * 60));
  return { distanceKm, driveMinutes };
}

function passesForResort(name: string): ("IKON" | "EPIC" | "Verify")[] {
  const n = name.toLowerCase();

  if (/palisades|sierra-at-tahoe|sierra at tahoe|mammoth|june mountain|deer valley|aspen|snowmass|buttermilk|ajax|alta|snowbird|brighton|solitude|copper|jackson|telluride|big sky|killington/.test(n)) {
    return ["IKON"];
  }
  if (/northstar|heavenly|kirkwood|park city|breckenridge|keystone|vail|beaver creek|whistler|stowe|okemo|mount snow/.test(n)) {
    return ["EPIC"];
  }
  if (/woodward|lee canyon|brian head/.test(n)) {
    return ["Verify"];
  }

  return ["Verify"];
}

export function skiIntelForText(haystack: string): SkiIntel {
  const h = haystack.toLowerCase();
  for (const key of Object.keys(regions).sort((a, b) => b.length - a.length)) {
    if (h.includes(key)) {
      const row = regions[key];
      return {
        matched: true,
        matchKey: key,
        skiResorts: row.skiResorts,
        resortPasses: row.skiResorts.map((name) => ({ name, passes: passesForResort(name) })),
        ikon: row.ikon,
        epic: row.epic,
        notes: row.notes,
      };
    }
  }
  return {
    matched: false,
    skiResorts: [],
    resortPasses: [],
    ikon: null,
    epic: null,
    notes:
      "No built-in ski mapping for this property name. Add coordinates and pick a destination airport, then verify passes against the mountain you plan to ski.",
  };
}

export function addSkiDriveEstimates(intel: SkiIntel, hotel: { lat: number; lon: number }): SkiIntel {
  return {
    ...intel,
    resortPasses: intel.resortPasses.map((resort) => {
      const coordinates = skiCoordinatesForName(resort.name);
      if (!coordinates) return resort;
      return { ...resort, ...estimatedDrive(hotel, coordinates) };
    }),
  };
}

export function passSummary(intel: SkiIntel): string {
  if (!intel.matched) return intel.notes ?? "Unknown pass fit.";
  const parts: string[] = [];
  if (intel.ikon === true) parts.push("Ikon-friendly (for mapped mountains)");
  if (intel.ikon === false) parts.push("Ikon: unlikely for the primary mapped mountains");
  if (intel.epic === true) parts.push("Epic-friendly (for mapped mountains)");
  if (intel.epic === false) parts.push("Epic: unlikely for the primary mapped mountains");
  if (intel.ikon === null && intel.epic === null) parts.push("Passes not applicable (non-ski destination).");
  return parts.join(" · ");
}
