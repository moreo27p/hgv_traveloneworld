import type { DayPlan, Season } from "@/lib/types";

function eachDateInclusive(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (d <= last) {
    out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const summerTemplates = [
  ["Morning: easy local walk or coffee in town", "Afternoon: main attraction or pool/beach time", "Evening: casual dinner near property"],
  ["Morning: light activity / farmers market", "Afternoon: scenic drive or museum", "Evening: sunset viewpoint"],
  ["Morning: outdoor activity (hike, kayak, golf—pick what fits)", "Afternoon: spa or downtime", "Evening: local food spot"],
  ["Morning: day-trip setup / rental pickup if needed", "Afternoon: signature regional experience", "Evening: low-key recovery"],
];

const winterTemplates = [
  ["Morning: on-snow warm-up laps", "Afternoon: longer runs / lesson block", "Evening: hot tub + early night"],
  ["Morning: ski until early afternoon", "Afternoon: gear tune or rest", "Evening: casual meal"],
  ["Morning: alternate activity (snowshoe, town, ice skating)", "Afternoon: short ski session or rest", "Evening: explore base village"],
  ["Morning: travel buffer / weather flex", "Afternoon: flexible—ski if conditions are great", "Evening: pack + prep for departure leg"],
];

export function buildItinerary(
  startISO: string,
  endISO: string,
  season: Season,
  context: { attractions?: string[]; skiResorts?: string[] } = {}
): DayPlan[] {
  const start = new Date(startISO + "T12:00:00Z");
  const end = new Date(endISO + "T12:00:00Z");
  const days = eachDateInclusive(start, end);
  const templates = season === "winter" ? winterTemplates : summerTemplates;

  return days.map((d, idx) => {
    const t = templates[idx % templates.length];
    const dateStr = d.toISOString().slice(0, 10);
    const label =
      season === "winter"
        ? idx === 0
          ? "Arrival / settle in"
          : idx === days.length - 1
            ? "Departure / travel day"
            : `Day ${idx + 1} on trip`
        : idx === 0
          ? "Arrival day"
          : idx === days.length - 1
            ? "Departure day"
            : `Exploration day ${idx + 1}`;
    const suggestions = [...t];
    const attraction = context.attractions?.[(idx - 1) % context.attractions.length];
    const skiResort = context.skiResorts?.[(idx - 1) % context.skiResorts.length];

    if (idx > 0 && idx < days.length - 1 && attraction) {
      suggestions[1] = `Afternoon: ${attraction}`;
    }
    if (season === "winter" && idx > 0 && idx < days.length - 1 && skiResort) {
      suggestions[0] = `Morning: ski ${skiResort}`;
    }

    return { date: dateStr, label, suggestions };
  });
}
