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

type OneworldGraphEdge = {
  to: string;
  carriers: string[];
};

type FallbackRoute = {
  route: string;
  carriers: string[];
};

type DestinationCluster =
  | "west-coast-ski"
  | "hawaii"
  | "europe-leisure"
  | "japan"
  | "mexico-beach"
  | "canada-west"
  | "us-sunbelt";

const ONEWORLD_ROUTE_GRAPH: Record<string, OneworldGraphEdge[]> = {
  YYZ: [
    { to: "CLT", carriers: ["AA"] },
    { to: "CMN", carriers: ["AT"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "HKG", carriers: ["CX"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "MCT", carriers: ["WY"] },
    { to: "NRT", carriers: ["JL"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "SEA", carriers: ["AS"] },
    { to: "SFO", carriers: ["AS"] },
    { to: "SYD", carriers: ["QF"] },
    { to: "LHR", carriers: ["BA"] },
    { to: "MAD", carriers: ["IB"] },
    { to: "DOH", carriers: ["QR"] },
    { to: "HND", carriers: ["JL"] },
  ],
  CLT: [
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "RNO", carriers: ["AA"] },
  ],
  DFW: [
    { to: "ASE", carriers: ["AA"] },
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DEN", carriers: ["AA"] },
    { to: "JAC", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "RNO", carriers: ["AA"] },
    { to: "SEA", carriers: ["AA", "AS"] },
    { to: "SFO", carriers: ["AA", "AS"] },
    { to: "SLC", carriers: ["AA"] },
    { to: "TUS", carriers: ["AA"] },
  ],
  CMN: [
    { to: "AGP", carriers: ["AT"] },
    { to: "CDG", carriers: ["AT"] },
    { to: "FCO", carriers: ["AT"] },
    { to: "NCE", carriers: ["AT"] },
  ],
  DCA: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "YYZ", carriers: ["AA"] },
  ],
  DOH: [
    { to: "CDG", carriers: ["QR"] },
    { to: "FCO", carriers: ["QR"] },
    { to: "HND", carriers: ["QR"] },
    { to: "NCE", carriers: ["QR"] },
    { to: "PSA", carriers: ["QR"] },
    { to: "SJD", carriers: ["QR"] },
  ],
  HND: [
    { to: "OKA", carriers: ["JL"] },
  ],
  HKG: [
    { to: "HND", carriers: ["CX"] },
    { to: "OKA", carriers: ["CX"] },
  ],
  HEL: [
    { to: "CDG", carriers: ["AY"] },
    { to: "NCE", carriers: ["AY"] },
    { to: "MAN", carriers: ["AY"] },
  ],
  HNL: [
    { to: "KOA", carriers: ["AS"] },
    { to: "LAX", carriers: ["AS"] },
    { to: "LIH", carriers: ["AS"] },
    { to: "OGG", carriers: ["AS"] },
    { to: "SAN", carriers: ["AS"] },
    { to: "SEA", carriers: ["AS"] },
    { to: "SFO", carriers: ["AS"] },
  ],
  JFK: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "SEA", carriers: ["AA", "AS"] },
    { to: "SFO", carriers: ["AA", "AS"] },
    { to: "HND", carriers: ["JL"] },
    { to: "LHR", carriers: ["BA", "AA"] },
    { to: "MAD", carriers: ["IB", "AA"] },
  ],
  LAX: [
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "HND", carriers: ["JL"] },
    { to: "HNL", carriers: ["AS"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PDX", carriers: ["AS"] },
    { to: "PHX", carriers: ["AA", "AS"] },
    { to: "RNO", carriers: ["AA", "AS"] },
    { to: "SAN", carriers: ["AS"] },
    { to: "SEA", carriers: ["AS", "AA"] },
    { to: "SFO", carriers: ["AS", "AA"] },
    { to: "SLC", carriers: ["AA", "AS"] },
  ],
  LHR: [
    { to: "AGP", carriers: ["BA"] },
    { to: "CDG", carriers: ["BA"] },
    { to: "EDI", carriers: ["BA"] },
    { to: "FAO", carriers: ["BA"] },
    { to: "FCO", carriers: ["BA"] },
    { to: "MAD", carriers: ["BA", "IB"] },
    { to: "MAH", carriers: ["BA"] },
    { to: "MAN", carriers: ["BA"] },
    { to: "NCE", carriers: ["BA"] },
    { to: "PSA", carriers: ["BA"] },
  ],
  MAD: [
    { to: "AGP", carriers: ["IB"] },
    { to: "FAO", carriers: ["IB"] },
    { to: "LPA", carriers: ["IB"] },
    { to: "MAH", carriers: ["IB"] },
    { to: "NCE", carriers: ["IB"] },
    { to: "PSA", carriers: ["IB"] },
    { to: "TFS", carriers: ["IB"] },
  ],
  MCT: [
    { to: "CDG", carriers: ["WY"] },
    { to: "FCO", carriers: ["WY"] },
    { to: "HND", carriers: ["WY"] },
    { to: "NCE", carriers: ["WY"] },
  ],
  MIA: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
  ],
  ORD: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "PHL", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
    { to: "RNO", carriers: ["AA"] },
    { to: "SEA", carriers: ["AA", "AS"] },
  ],
  PDX: [
    { to: "LAX", carriers: ["AS"] },
    { to: "RNO", carriers: ["AS"] },
    { to: "SEA", carriers: ["AS"] },
    { to: "SFO", carriers: ["AS"] },
  ],
  PHL: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "MIA", carriers: ["AA"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA"] },
  ],
  PHX: [
    { to: "CLT", carriers: ["AA"] },
    { to: "DCA", carriers: ["AA"] },
    { to: "DFW", carriers: ["AA"] },
    { to: "JFK", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA", "AS"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "RNO", carriers: ["AA", "AS"] },
    { to: "SFO", carriers: ["AA", "AS"] },
    { to: "TUS", carriers: ["AA"] },
  ],
  RNO: [
    { to: "DFW", carriers: ["AA"] },
    { to: "LAX", carriers: ["AA", "AS"] },
    { to: "ORD", carriers: ["AA"] },
    { to: "PHX", carriers: ["AA", "AS"] },
    { to: "SEA", carriers: ["AS"] },
    { to: "SFO", carriers: ["AS"] },
  ],
  SEA: [
    { to: "HNL", carriers: ["AS"] },
    { to: "JAC", carriers: ["AS"] },
    { to: "KOA", carriers: ["AS"] },
    { to: "LAX", carriers: ["AS", "AA"] },
    { to: "LIH", carriers: ["AS"] },
    { to: "OGG", carriers: ["AS"] },
    { to: "PDX", carriers: ["AS"] },
    { to: "PHX", carriers: ["AS"] },
    { to: "RNO", carriers: ["AS"] },
    { to: "SAN", carriers: ["AS"] },
    { to: "SFO", carriers: ["AS"] },
    { to: "SLC", carriers: ["AS"] },
    { to: "YVR", carriers: ["AS"] },
  ],
  SFO: [
    { to: "HND", carriers: ["JL"] },
    { to: "HNL", carriers: ["AS"] },
    { to: "JAC", carriers: ["AS"] },
    { to: "KOA", carriers: ["AS"] },
    { to: "LAX", carriers: ["AS", "AA"] },
    { to: "LIH", carriers: ["AS"] },
    { to: "OGG", carriers: ["AS"] },
    { to: "PDX", carriers: ["AS"] },
    { to: "RNO", carriers: ["AS"] },
    { to: "SEA", carriers: ["AS"] },
    { to: "SLC", carriers: ["AS", "AA"] },
    { to: "YVR", carriers: ["AS"] },
  ],
  SYD: [
    { to: "HND", carriers: ["QF"] },
    { to: "NAN", carriers: ["QF", "FJ"] },
  ],
  YVR: [
    { to: "SEA", carriers: ["AS"] },
  ],
  NRT: [
    { to: "HND", carriers: ["JL"] },
    { to: "OKA", carriers: ["JL"] },
  ],
};

const DESTINATION_CLUSTERS: Record<string, DestinationCluster> = {
  AGP: "europe-leisure",
  ASE: "west-coast-ski",
  BZN: "west-coast-ski",
  CDC: "west-coast-ski",
  DCA: "us-sunbelt",
  EDI: "europe-leisure",
  FAO: "europe-leisure",
  FCO: "europe-leisure",
  HER: "europe-leisure",
  HND: "japan",
  HNL: "hawaii",
  JAC: "west-coast-ski",
  KOA: "hawaii",
  LIH: "hawaii",
  LPA: "europe-leisure",
  MAH: "europe-leisure",
  MMH: "west-coast-ski",
  NAN: "hawaii",
  NCE: "europe-leisure",
  OGG: "hawaii",
  OKA: "japan",
  PSA: "europe-leisure",
  RNO: "west-coast-ski",
  SJD: "mexico-beach",
  SLC: "west-coast-ski",
  SXM: "mexico-beach",
  SZG: "europe-leisure",
  TEX: "west-coast-ski",
  TFS: "europe-leisure",
  YUL: "us-sunbelt",
  YVR: "canada-west",
  YYC: "canada-west",
  ZIH: "mexico-beach",
};

const CLUSTER_HUB_PRIORITIES: Record<DestinationCluster, string[]> = {
  "west-coast-ski": ["SEA", "SFO", "LAX", "DFW", "PHX", "ORD"],
  hawaii: ["SEA", "SFO", "LAX", "HNL", "DFW"],
  "europe-leisure": ["LHR", "MAD", "DOH", "CMN", "MCT", "JFK"],
  japan: ["HND", "NRT", "LAX", "SFO", "HKG", "DOH"],
  "mexico-beach": ["DFW", "LAX", "MIA", "DOH", "PHX"],
  "canada-west": ["SEA", "SFO", "LAX", "DFW"],
  "us-sunbelt": ["DFW", "CLT", "MIA", "PHX", "LAX"],
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

function knownOneworldRoutes(origin: string, destination: string): FallbackRoute[] {
  const o = origin.toUpperCase();
  const d = destination.toUpperCase();
  const routes = new Map<string, Set<string>>();

  function visit(current: string, path: string[], carriers: Set<string>, legs: number) {
    if (legs > 3) return;
    if (current === d && path.length > 1) {
      routes.set(path.join(" -> "), new Set(carriers));
      return;
    }
    for (const edge of ONEWORLD_ROUTE_GRAPH[current] ?? []) {
      if (path.includes(edge.to) && edge.to !== d) continue;
      const nextCarriers = new Set(carriers);
      for (const carrier of edge.carriers) nextCarriers.add(carrier);
      visit(edge.to, [...path, edge.to], nextCarriers, legs + 1);
    }
  }

  visit(o, [o], new Set<string>(), 0);

  const cluster = DESTINATION_CLUSTERS[d];
  const clusterPriority = cluster ? CLUSTER_HUB_PRIORITIES[cluster] : [];
  const priority = new Map([
    ["YYZ -> DFW -> RNO", 0],
    ["YYZ -> DFW -> PHX -> RNO", 1],
    ["YYZ -> SEA -> RNO", 2],
    ["YYZ -> SFO -> RNO", 3],
  ]);

  return [...routes.entries()]
    .map(([route, routeCarriers]) => ({ route, carriers: [...routeCarriers].sort() }))
    .sort((a, b) => {
      const priorityDiff = (priority.get(a.route) ?? 99) - (priority.get(b.route) ?? 99);
      if (priorityDiff) return priorityDiff;

      const aStops = a.route.split(" -> ");
      const bStops = b.route.split(" -> ");
      const aHubs = aStops.slice(1, -1);
      const bHubs = bStops.slice(1, -1);

      const clusterScore = (hubs: string[]) => {
        if (clusterPriority.length === 0) return 0;
        const ranked = hubs.map((hub) => {
          const index = clusterPriority.indexOf(hub);
          return index === -1 ? clusterPriority.length + 5 : index;
        });
        return ranked.length > 0 ? Math.min(...ranked) : clusterPriority.length + 10;
      };

      const clusterDiff = clusterScore(aHubs) - clusterScore(bHubs);
      if (clusterDiff) return clusterDiff;

      return aStops.length - bStops.length || a.route.localeCompare(b.route);
    });
}

function fallbackOneworldSummary(origin: string, destination: string, configured: boolean): OneworldFlightSummary {
  const routes = knownOneworldRoutes(origin, destination);
  const stopCount = (route: string) => Math.max(0, route.split(" -> ").length - 2);
  const carriers = [...new Set(routes.flatMap((route) => route.carriers))]
    .filter((code) => ONEWORLD_CARRIERS[code])
    .sort()
    .map((code) => `${code} ${ONEWORLD_CARRIERS[code]}`);

  return {
    configured,
    source: "estimated",
    total: routes.length,
    direct: routes.filter((route) => stopCount(route.route) === 0).length,
    oneStop: routes.filter((route) => stopCount(route.route) === 1).length,
    twoPlusStops: routes.filter((route) => stopCount(route.route) >= 2).length,
    carriers: carriers.length > 0 ? carriers : ["AA American Airlines"],
    sampleRoutes: routes.slice(0, 5).map((route) => route.route),
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
    source: "live",
    total: oneworldOffers.length,
    direct: oneworldOffers.filter((offer) => totalStops(offer) === 0).length,
    oneStop: oneworldOffers.filter((offer) => totalStops(offer) === 1).length,
    twoPlusStops: oneworldOffers.filter((offer) => totalStops(offer) >= 2).length,
    carriers,
    sampleRoutes,
    message: oneworldOffers.length ? undefined : "No all-oneworld combinations found in live flight offers.",
  };
}
