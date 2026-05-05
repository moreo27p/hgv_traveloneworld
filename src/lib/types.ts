export type Season = "summer" | "winter";

export type HgvResort = {
  id: string;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  /** IATA if present in Airtable */
  airport: string | null;
  raw: Record<string, unknown>;
};

export type SkiIntel = {
  matched: boolean;
  matchKey?: string;
  skiResorts: string[];
  resortPasses: {
    name: string;
    passes: ("IKON" | "EPIC" | "Verify")[];
    distanceKm?: number;
    driveMinutes?: number;
  }[];
  ikon: boolean | null;
  epic: boolean | null;
  notes: string | null;
};

export type DayPlan = {
  date: string;
  label: string;
  suggestions: string[];
};

export type FlightOfferSummary = {
  id: string;
  price: string | null;
  currency: string | null;
  stops: number;
  outboundDuration: string | null;
  returnDuration: string | null;
  carriers: string[];
  deepLink?: string;
};

export type OneworldFlightSummary = {
  configured: boolean;
  source: "live" | "estimated";
  total: number;
  direct: number;
  oneStop: number;
  twoPlusStops: number;
  carriers: string[];
  sampleRoutes: string[];
  message?: string;
};

export type PlanResponse = {
  resort: HgvResort;
  season: Season;
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  itinerary: DayPlan[];
  ski?: SkiIntel;
  weather: {
    daily: {
      date: string;
      tempMinC: number;
      tempMaxC: number;
      precipMm: number;
      weatherCode: number;
    }[];
    message?: string;
    source?: "forecast" | "typical";
  };
  attractions: { name: string; type: string; lat: number; lon: number }[];
  flights: {
    origin: { code: string; name: string };
    destination: { code: string; name: string };
    googleFlightsUrl: string;
    oneworld: OneworldFlightSummary;
  };
};
