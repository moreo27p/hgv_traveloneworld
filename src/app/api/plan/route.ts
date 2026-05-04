import { NextResponse } from "next/server";
import { searchOneworldFlightCombinations } from "@/lib/amadeus";
import { airportName, guessDestinationIata, googleFlightsUrl } from "@/lib/airports";
import { fallbackAttractionsForText } from "@/lib/attractions";
import { geocodeLocation } from "@/lib/geocode";
import { buildItinerary } from "@/lib/itinerary";
import type { DailyWeather } from "@/lib/openmeteo";
import { buildTypicalWeatherDaily, fetchForecastDaily } from "@/lib/openmeteo";
import { fetchTourismNearby } from "@/lib/overpass";
import { fetchResorts } from "@/lib/resorts";
import { addSkiDriveEstimates, skiIntelForText } from "@/lib/ski";
import type { HgvResort, PlanResponse, Season } from "@/lib/types";

type Body = {
  resortId: string;
  startDate: string;
  endDate: string;
  season: Season;
  originAirport?: string;
  destinationAirport?: string | null;
};

const HOME_AIRPORT = "YYZ";

type WeatherResult = {
  daily: DailyWeather[];
  message?: string;
  source: "forecast" | "typical";
};

function nightsBetween(start: string, end: string): { nights: number; days: number } {
  const s = new Date(start + "T12:00:00Z").getTime();
  const e = new Date(end + "T12:00:00Z").getTime();
  const ms = e - s;
  const nights = Math.max(0, Math.round(ms / 86400000));
  return { nights, days: nights + 1 };
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { resortId, startDate, endDate, season } = body;
  if (!resortId || !startDate || !endDate || !season) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }
  if (!validDate(startDate) || !validDate(endDate)) {
    return NextResponse.json({ ok: false, error: "Use valid YYYY-MM-DD dates." }, { status: 400 });
  }
  if (new Date(`${endDate}T12:00:00Z`) <= new Date(`${startDate}T12:00:00Z`)) {
    return NextResponse.json({ ok: false, error: "End date must be after start date." }, { status: 400 });
  }
  if (season !== "summer" && season !== "winter") {
    return NextResponse.json({ ok: false, error: "season must be summer or winter." }, { status: 400 });
  }

  const o = HOME_AIRPORT;
  if (!/^[A-Z]{3}$/.test(o)) {
    return NextResponse.json({ ok: false, error: "originAirport must be a 3-letter IATA code." }, { status: 400 });
  }

  let resort: HgvResort | null = null;
  try {
    const { resorts } = await fetchResorts();
    resort = resorts.find((r) => r.id === resortId) ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load resort list";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
  if (!resort) {
    return NextResponse.json({ ok: false, error: "Resort not found." }, { status: 404 });
  }

  const destOverride = body.destinationAirport?.trim().toUpperCase();
  const dest =
    destOverride && /^[A-Z]{3}$/.test(destOverride)
      ? destOverride
      : resort.airport?.trim().toUpperCase() && /^[A-Z]{3}$/.test(resort.airport.trim())
        ? resort.airport.trim().toUpperCase()
        : guessDestinationIata(resort.name, resort.location);

  if (!dest) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not determine a destination IATA airport. Add an Airport/IATA column in Airtable or pass destinationAirport in the request.",
      },
      { status: 400 }
    );
  }

  let lat = resort.lat;
  let lng = resort.lng;
  if (lat == null || lng == null) {
    const queries = [`${resort.name} ${resort.location}`.trim(), resort.location, String(resort.raw.City ?? "")].filter(
      Boolean
    );
    let geo: { lat: number; lon: number } | null = null;
    for (const query of queries) {
      geo = await geocodeLocation(query);
      if (geo) break;
    }
    if (geo) {
      lat = geo.lat;
      lng = geo.lon;
    }
  }
  if (lat == null || lng == null) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No coordinates for this resort and geocoding failed. Add Lat/Lng columns in Airtable or improve the Location text.",
      },
      { status: 400 }
    );
  }

  const { nights, days } = nightsBetween(startDate, endDate);
  const haystack = `${resort.name} ${resort.location}`;
  const ski =
    season === "winter" ? addSkiDriveEstimates(skiIntelForText(haystack), { lat, lon: lng }) : undefined;

  const [weatherResult, attractionsResult, oneworld] = await Promise.all([
    fetchForecastDaily(lat, lng, startDate, endDate)
      .then((daily): WeatherResult => {
        if (daily.length > 0) return { daily, source: "forecast" };
        return {
          daily: buildTypicalWeatherDaily(lat, startDate, endDate),
          source: "typical",
          message: "Typical temperatures shown.",
        };
      })
      .catch(
        (): WeatherResult => ({
        daily: buildTypicalWeatherDaily(lat, startDate, endDate),
        source: "typical",
        message: "Typical temperatures shown.",
        })
      ),
    fetchTourismNearby(lat, lng)
      .then((items) => ({ items }))
      .catch(() => ({ items: [] })),
    searchOneworldFlightCombinations({
      originIata: o,
      destinationIata: dest,
      departureDate: startDate,
      returnDate: endDate,
    }),
  ]);
  const attractions =
    attractionsResult.items.length > 0 ? attractionsResult.items : fallbackAttractionsForText(haystack, lat, lng);
  const itinerary = buildItinerary(startDate, endDate, season, {
    attractions: attractions.map((a) => a.name),
    skiResorts: ski?.skiResorts ?? [],
  });

  const googleFlightsUrlFinal = googleFlightsUrl({
    origin: o,
    destination: dest,
    departDate: startDate,
    returnDate: endDate,
  });

  const plan: PlanResponse = {
    resort: { ...resort, lat, lng },
    season,
    startDate,
    endDate,
    nights,
    days,
    itinerary,
    ski,
    weather: { daily: weatherResult.daily, message: weatherResult.message, source: weatherResult.source },
    attractions: attractions.map((a) => ({ name: a.name, type: a.type, lat: a.lat, lon: a.lon })),
    flights: {
      origin: { code: o, name: airportName(o) },
      destination: { code: dest, name: airportName(dest) },
      googleFlightsUrl: googleFlightsUrlFinal,
      oneworld,
    },
  };

  return NextResponse.json({ ok: true, plan, meta: { destinationIata: dest } });
}
