import type { FlightOfferSummary, OneworldFlightSummary } from "@/lib/types";

const ONEWORLD_CARRIERS: Record<string, string> = {
  AA: "American Airlines",
  AS: "Alaska Airlines",
  AT: "Royal Air Maroc",
  AY: "Finnair",
  BA: "British Airways",
  CX: "Cathay Pacific",
  FJ: "Fiji Airways",
  IB: "Iberia",
  JL: "Japan Airlines",
  MH: "Malaysia Airlines",
  QF: "Qantas",
  QR: "Qatar Airways",
  RJ: "Royal Jordanian",
  UL: "SriLankan Airlines",
  WY: "Oman Air",
};

const ONEWORLD_ROUTE_GRAPH: Record<string, string[]> = {
  YYZ: ["CLT", "DFW", "JFK", "LAX", "MIA", "ORD", "PHL"],
  CLT: ["DFW", "LAX", "MIA", "ORD", "PHL", "PHX", "RNO"],
  DFW: ["ASE", "CLT", "DEN", "JAC", "LAX", "MIA", "ORD", "PHL", "PHX", "RNO", "SFO", "SLC", "TUS"],
  JFK: ["CLT", "DFW", "LAX", "MIA", "ORD", "PHL", "PHX", "SFO"],
  LAX: ["DFW", "JFK", "MIA", "ORD", "PHX", "RNO", "SFO"],
  MIA: ["CLT", "DFW", "JFK", "LAX", "ORD", "PHL", "PHX"],
  ORD: ["CLT", "DFW", "JFK", "LAX", "MIA", "PHL", "PHX", "RNO"],
  PHL: ["CLT", "DFW", "JFK", "MIA", "ORD", "PHX"],
  PHX: ["CLT", "DFW", "JFK", "LAX", "ORD", "RNO", "SFO", "TUS"],
  RNO: ["DFW", "LAX", "ORD", "PHX"],
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

async function getToken(): Promise<string | null> {
  const id = env("AMADEUS_CLIENT_ID");
  const secret = env("AMADEUS_CLIENT_SECRET");
  if (!id || !secret) return null;

  const host = env("AMADEUS_HOSTNAME") ?? "test.api.amadeus.com";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(`https://${host}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

function isoDate(d: string): string {
  return d.slice(0, 10);
}

function summarizeOffer(offer: unknown): FlightOfferSummary | null {
  if (!offer || typeof offer !== "object") return null;
  const o = offer as {
    id?: string;
    price?: { total?: string; currency?: string };
    itineraries?: {
      duration?: string;
      segments?: { carrierCode?: string; number?: string }[];
    }[];
  };
  const id = o.id ?? "unknown";
  const price = o.price?.total ?? null;
  const currency = o.price?.currency ?? null;
  const itins = o.itineraries ?? [];
  const outbound = itins[0];
  const ret = itins[1];
  const outboundSegs = outbound?.segments?.length ?? 0;
  const returnSegs = ret?.segments?.length ?? 0;
  const stops = Math.max(0, outboundSegs - 1) + Math.max(0, returnSegs - 1);
  const carriers = new Set<string>();
  for (const it of itins) {
    for (const s of it.segments ?? []) {
      if (s.carrierCode) carriers.add(s.carrierCode);
    }
  }
  return {
    id,
    price,
    currency,
    stops,
    outboundDuration: outbound?.duration ?? null,
    returnDuration: ret?.duration ?? null,
    carriers: [...carriers],
  };
}

type AmadeusSegment = {
  carrierCode?: string;
  operating?: { carrierCode?: string };
  departure?: { iataCode?: string };
  arrival?: { iataCode?: string };
};

type AmadeusOffer = {
  itineraries?: {
    segments?: AmadeusSegment[];
  }[];
};

function carrierForSegment(segment: AmadeusSegment): string | null {
  return (segment.operating?.carrierCode ?? segment.carrierCode ?? "").toUpperCase() || null;
}

function isOneworldOffer(offer: AmadeusOffer): boolean {
  const segments = offer.itineraries?.flatMap((itinerary) => itinerary.segments ?? []) ?? [];
  return segments.length > 0 && segments.every((segment) => {
    const carrier = carrierForSegment(segment);
    return Boolean(carrier && ONEWORLD_CARRIERS[carrier]);
  });
}

function outboundRoute(offer: AmadeusOffer): string | null {
  const segments = offer.itineraries?.[0]?.segments ?? [];
  const firstDeparture = segments[0]?.departure?.iataCode;
  if (!firstDeparture) return null;
  const airports = [firstDeparture, ...segments.map((segment) => segment.arrival?.iataCode).filter(Boolean)];
  return airports.join(" -> ");
}

function totalStops(offer: AmadeusOffer): number {
  return (offer.itineraries ?? []).reduce((sum, itinerary) => {
    return sum + Math.max(0, (itinerary.segments?.length ?? 0) - 1);
  }, 0);
}

function carriersForOffer(offer: AmadeusOffer): string[] {
  const segments = offer.itineraries?.flatMap((itinerary) => itinerary.segments ?? []) ?? [];
  return [...new Set(segments.map(carrierForSegment).filter(Boolean) as string[])];
}

function knownOneworldRoutes(origin: string, destination: string): string[] {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  const routes = new Set<string>();

  if (ONEWORLD_ROUTE_GRAPH[o]?.includes(d)) {
    routes.add(`${o} -> ${d}`);
  }

  for (const hub of ONEWORLD_ROUTE_GRAPH[o] ?? []) {
    if (ONEWORLD_ROUTE_GRAPH[hub]?.includes(d)) {
      routes.add(`${o} -> ${hub} -> ${d}`);
    }
  }

  for (const hub1 of ONEWORLD_ROUTE_GRAPH[o] ?? []) {
    for (const hub2 of ONEWORLD_ROUTE_GRAPH[hub1] ?? []) {
      if (hub2 === o || hub2 === hub1) continue;
      if (ONEWORLD_ROUTE_GRAPH[hub2]?.includes(d)) {
        routes.add(`${o} -> ${hub1} -> ${hub2} -> ${d}`);
      }
    }
  }

  const priority = new Map([
    ["YYZ -> DFW -> RNO", 0],
    ["YYZ -> DFW -> PHX -> RNO", 1],
  ]);

  return [...routes].sort((a, b) => {
    const priorityDiff = (priority.get(a) ?? 99) - (priority.get(b) ?? 99);
    return priorityDiff || a.split(" -> ").length - b.split(" -> ").length || a.localeCompare(b);
  });
}

function fallbackOneworldSummary(origin: string, destination: string, configured: boolean): OneworldFlightSummary {
  const routes = knownOneworldRoutes(origin, destination);
  const stopCount = (route: string) => Math.max(0, route.split(" -> ").length - 2);

  return {
    configured,
    total: routes.length,
    direct: routes.filter((route) => stopCount(route) === 0).length,
    oneStop: routes.filter((route) => stopCount(route) === 1).length,
    twoPlusStops: routes.filter((route) => stopCount(route) >= 2).length,
    carriers: ["AA American Airlines"],
    sampleRoutes: routes.slice(0, 5),
    message: configured
      ? "Live offers were unavailable; showing estimated oneworld routings."
      : "Estimated oneworld routings shown. Add Amadeus API keys for date-specific live counts.",
  };
}

export async function searchRoundTripFlights(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
}): Promise<{ offers: FlightOfferSummary[]; message?: string }> {
  const token = await getToken();
  if (!token) return { offers: [], message: "Amadeus not configured or token failed." };

  const host = env("AMADEUS_HOSTNAME") ?? "test.api.amadeus.com";
  const url = new URL(`https://${host}/v2/shopping/flight-offers`);
  url.searchParams.set("originLocationCode", params.originIata.toUpperCase());
  url.searchParams.set("destinationLocationCode", params.destinationIata.toUpperCase());
  url.searchParams.set("departureDate", isoDate(params.departureDate));
  url.searchParams.set("returnDate", isoDate(params.returnDate));
  url.searchParams.set("adults", String(params.adults ?? 1));
  url.searchParams.set("currencyCode", "USD");
  url.searchParams.set("max", "15");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return { offers: [], message: `Amadeus flight search failed (${res.status}): ${text.slice(0, 200)}` };
  }
  const json = (await res.json()) as { data?: unknown[] };
  const raw = json.data ?? [];
  const offers = raw.map(summarizeOffer).filter(Boolean) as FlightOfferSummary[];
  offers.sort((a, b) => a.stops - b.stops);
  return { offers };
}

export async function searchOneworldFlightCombinations(params: {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
}): Promise<OneworldFlightSummary> {
  const token = await getToken();
  if (!token) {
    return fallbackOneworldSummary(params.originIata, params.destinationIata, false);
  }

  const host = env("AMADEUS_HOSTNAME") ?? "test.api.amadeus.com";
  const url = new URL(`https://${host}/v2/shopping/flight-offers`);
  url.searchParams.set("originLocationCode", params.originIata.toUpperCase());
  url.searchParams.set("destinationLocationCode", params.destinationIata.toUpperCase());
  url.searchParams.set("departureDate", isoDate(params.departureDate));
  url.searchParams.set("returnDate", isoDate(params.returnDate));
  url.searchParams.set("adults", String(params.adults ?? 1));
  url.searchParams.set("currencyCode", "USD");
  url.searchParams.set("max", "50");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      ...fallbackOneworldSummary(params.originIata, params.destinationIata, true),
      message: `Live flight search unavailable (${res.status}); showing estimated oneworld routings.`,
    };
  }

  const json = (await res.json()) as { data?: AmadeusOffer[] };
  const oneworldOffers = (json.data ?? []).filter(isOneworldOffer);
  const carriers = [...new Set(oneworldOffers.flatMap(carriersForOffer))]
    .sort()
    .map((code) => `${code} ${ONEWORLD_CARRIERS[code]}`);
  const sampleRoutes = [...new Set(oneworldOffers.map(outboundRoute).filter(Boolean) as string[])].slice(0, 3);

  if (oneworldOffers.length === 0) {
    return fallbackOneworldSummary(params.originIata, params.destinationIata, true);
  }

  return {
    configured: true,
    total: oneworldOffers.length,
    direct: oneworldOffers.filter((offer) => totalStops(offer) === 0).length,
    oneStop: oneworldOffers.filter((offer) => totalStops(offer) === 1).length,
    twoPlusStops: oneworldOffers.filter((offer) => totalStops(offer) >= 2).length,
    carriers,
    sampleRoutes,
    message: oneworldOffers.length ? undefined : "No all-oneworld combinations found in live flight offers.",
  };
}
