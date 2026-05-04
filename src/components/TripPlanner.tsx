"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { HgvResort, PlanResponse, Season } from "@/lib/types";

type ResortsPayload = { ok: boolean; resorts: HgvResort[]; source?: "airtable" | "local-csv"; error?: string };
type PlanPayload = { ok: boolean; plan?: PlanResponse; error?: string };

const HOME_AIRPORT = "YYZ";
const HOME_AIRPORT_NAME = "Toronto Pearson International Airport";
const IKON_DESTINATIONS_URL = "https://www.ikonpass.com/en/destinations";
const EPIC_DESTINATIONS_URL = "https://www.epicpass.com/region/region-overview.aspx";

function formatTemp(c: number): string {
  return `${Math.round(c)}°C`;
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}

function weatherTone(precipMm: number): string {
  if (precipMm >= 8) return "Wet";
  if (precipMm >= 1) return "Light rain";
  return "Dry";
}

function rawString(resort: HgvResort, key: string): string {
  const value = resort.raw[key];
  return typeof value === "string" ? value : "";
}

function destinationScope(resort: HgvResort): "international" | "us" {
  return rawString(resort, "Region").toLowerCase() === "international" ? "international" : "us";
}

function skiTileClasses(passes: string[]): string {
  if (passes.includes("IKON")) {
    return "border-blue-950 bg-blue-950";
  }
  if (passes.includes("EPIC")) {
    return "border-[#2D0A63] bg-[#2D0A63]";
  }
  return "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";
}

function skiBarClasses(passes: string[]): string {
  if (passes.includes("IKON")) return "bg-yellow-400";
  if (passes.includes("EPIC")) return "bg-[#FF5722]";
  return "bg-zinc-500";
}

function skiTrackClasses(passes: string[]): string {
  if (passes.includes("IKON")) return "bg-blue-900";
  if (passes.includes("EPIC")) return "bg-[#4B1E87]";
  return "bg-zinc-100 dark:bg-zinc-800";
}

function skiTextClasses(passes: string[]): string {
  if (passes.includes("IKON")) return "text-yellow-300";
  if (passes.includes("EPIC")) return "text-[#FF5722]";
  return "text-zinc-900 dark:text-zinc-50";
}

function skiMutedTextClasses(passes: string[]): string {
  if (passes.includes("IKON")) return "text-yellow-100/80";
  if (passes.includes("EPIC")) return "text-[#FF5722]/80";
  return "text-zinc-500 dark:text-zinc-400";
}

export function TripPlanner() {
  const [resorts, setResorts] = useState<HgvResort[]>([]);
  const [resortSource, setResortSource] = useState<"airtable" | "local-csv" | null>(null);
  const [resortError, setResortError] = useState<string | null>(null);
  const [loadingResorts, setLoadingResorts] = useState(true);

  const [scopeFilter, setScopeFilter] = useState<"" | "international" | "us">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [resortId, setResortId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [season, setSeason] = useState<Season>("summer");
  const [destOverride, setDestOverride] = useState("");

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingResorts(true);
      try {
        const res = await fetch("/api/resorts");
        const json = (await res.json()) as ResortsPayload;
        if (cancelled) return;
        if (!json.ok) {
          setResortError(json.error ?? "Could not load resorts.");
          setResorts([]);
        } else {
          setResortError(null);
          setResorts(json.resorts);
          setResortSource(json.source ?? null);
        }
      } catch {
        if (!cancelled) setResortError("Network error loading resorts.");
      } finally {
        if (!cancelled) setLoadingResorts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => resorts.find((r) => r.id === resortId) ?? null, [resorts, resortId]);
  const locationOptions = useMemo(() => {
    const values = resorts
      .filter((r) => !scopeFilter || destinationScope(r) === scopeFilter)
      .map((r) => rawString(r, "State/Country"))
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [resorts, scopeFilter]);
  const categoryOptions = useMemo(() => {
    const values = resorts
      .filter((r) => !scopeFilter || destinationScope(r) === scopeFilter)
      .filter((r) => !locationFilter || rawString(r, "State/Country") === locationFilter)
      .map((r) => rawString(r, "Category"))
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [resorts, scopeFilter, locationFilter]);
  const filteredResorts = useMemo(
    () =>
      resorts.filter((r) => {
        if (scopeFilter && destinationScope(r) !== scopeFilter) return false;
        if (locationFilter && rawString(r, "State/Country") !== locationFilter) return false;
        if (categoryFilter && rawString(r, "Category") !== categoryFilter) return false;
        return true;
      }),
    [resorts, scopeFilter, locationFilter, categoryFilter]
  );

  async function onBuildPlan(e: React.FormEvent) {
    e.preventDefault();
    setPlan(null);
    setPlanError(null);
    setPlanLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resortId,
          startDate,
          endDate,
          season,
          originAirport: HOME_AIRPORT,
          destinationAirport: destOverride.trim() || null,
        }),
      });
      const json = (await res.json()) as PlanPayload;
      if (!json.ok || !json.plan) {
        setPlanError(json.error ?? "Plan failed.");
        return;
      }
      setPlan(json.plan);
    } catch {
      setPlanError("Network error while building plan.");
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <header className="flex items-center gap-4">
        <Image
          src="/traveloneworld-logo.svg"
          alt="HGV Travel Oneworld"
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl shadow-sm"
        />
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">HGV + oneworld staff travel helper</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            HGV Travel Oneworld
          </h1>
        </div>
      </header>

      <form onSubmit={onBuildPlan} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="scope">
              Region
            </label>
            <select
              id="scope"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={scopeFilter}
              onChange={(e) => {
                setScopeFilter(e.target.value as "" | "international" | "us");
                setLocationFilter("");
                setCategoryFilter("");
                setResortId("");
              }}
            >
              <option value="">All</option>
              <option value="us">US</option>
              <option value="international">International</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="location">
              State / Country
            </label>
            <select
              id="location"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCategoryFilter("");
                setResortId("");
              }}
              disabled={locationOptions.length === 0}
            >
              <option value="">All</option>
              {locationOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="category">
              Hotel category
            </label>
            <select
              id="category"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setResortId("");
              }}
              disabled={categoryOptions.length === 0}
            >
              <option value="">All</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="resort">
            Destination: Hotel / Resort
          </label>
          <select
            id="resort"
            required
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            value={resortId}
            onChange={(e) => setResortId(e.target.value)}
            disabled={loadingResorts || filteredResorts.length === 0}
          >
            <option value="">
              {loadingResorts ? "Loading..." : filteredResorts.length ? "Choose a destination..." : "No destinations"}
            </option>
            {filteredResorts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.location ? ` — ${r.location}` : ""}
                {rawString(r, "Category") ? ` — ${rawString(r, "Category")}` : ""}
              </option>
            ))}
          </select>
          {resortError && <p className="text-sm text-red-600 dark:text-red-400">{resortError}</p>}
          {!resortError && resortSource === "local-csv" && (
            <p className="text-xs text-amber-700 dark:text-amber-300">Using your bundled HGV CSV list.</p>
          )}
        </div>

        {selected && (
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Selected: <span className="font-medium text-zinc-700 dark:text-zinc-300">{selected.name}</span>
            {selected.location ? ` · ${selected.location}` : ""}
            {rawString(selected, "Category") ? ` · ${rawString(selected, "Category")}` : ""}
            {selected.airport ? ` · Suggested airport: ${selected.airport}` : " · Airport suggestion needed"}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="start">
              From
            </label>
            <input
              id="start"
              type="date"
              required
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="end">
              To
            </label>
            <input
              id="end"
              type="date"
              required
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Trip type</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <input type="radio" name="season" checked={season === "summer"} onChange={() => setSeason("summer")} />
              Summer / general
            </label>
            <label className="inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <input type="radio" name="season" checked={season === "winter"} onChange={() => setSeason("winter")} />
              Winter (ski-focused pacing)
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Origin airport</p>
            <p className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium tracking-wide text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
              {HOME_AIRPORT}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Fixed origin.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="dest">
              Suggested destination airport override
            </label>
            <input
              id="dest"
              maxLength={3}
              placeholder={selected?.airport ?? "e.g. SLC"}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm uppercase tracking-wide dark:border-zinc-700 dark:bg-zinc-900"
              value={destOverride}
              onChange={(e) => setDestOverride(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Leave blank for the suggestion.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={planLoading || !resortId}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {planLoading ? "Building plan…" : "Build itinerary"}
        </button>
        {planError && <p className="text-sm text-red-600 dark:text-red-400">{planError}</p>}
      </form>

      {plan && (
        <section className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Trip</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{plan.days} days</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{plan.nights} nights</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">From</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {plan.flights.origin?.code ?? HOME_AIRPORT}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {plan.flights.origin?.name ?? HOME_AIRPORT_NAME}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">To</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {plan.flights.destination?.code ?? "?"}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {plan.flights.destination?.name ?? "Airport name unavailable"}
              </p>
            </div>
          </div>

          {plan.season === "winter" && plan.ski && (
            <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/80 p-5 dark:border-sky-900 dark:bg-sky-950/40">
              <h2 className="text-lg font-semibold text-sky-950 dark:text-sky-50">Ski</h2>
              {(plan.ski.resortPasses ?? []).length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(plan.ski.resortPasses ?? []).map((resort) => (
                    <div
                      key={resort.name}
                      className={`rounded-lg border p-3 ${skiTileClasses(resort.passes)}`}
                    >
                      <p className={`text-sm font-medium ${skiTextClasses(resort.passes)}`}>{resort.name}</p>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        {resort.distanceKm != null && resort.driveMinutes != null ? (
                          <div>
                            <p className={`text-2xl font-semibold ${skiTextClasses(resort.passes)}`}>
                              {resort.distanceKm} km
                            </p>
                            <p className={`text-xs ${skiMutedTextClasses(resort.passes)}`}>
                              ~{resort.driveMinutes} min drive
                            </p>
                          </div>
                        ) : (
                          <p className={`text-xs ${skiMutedTextClasses(resort.passes)}`}>
                            Drive estimate unavailable
                          </p>
                        )}
                        <div className={`h-2 min-w-16 flex-1 rounded-full ${skiTrackClasses(resort.passes)}`}>
                          <div
                            className={`h-2 rounded-full ${skiBarClasses(resort.passes)}`}
                            style={{ width: `${Math.min(100, Math.max(12, resort.distanceKm ?? 0))}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resort.passes.map((pass) => (
                          <span
                            key={`${resort.name}-${pass}`}
                            className={
                              pass === "IKON"
                                ? "rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-semibold text-blue-950"
                                : pass === "EPIC"
                                  ? "rounded-full bg-[#FF5722] px-2.5 py-1 text-xs font-semibold text-purple-950"
                                  : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                            }
                          >
                            {pass}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {plan.ski.notes && (
                <p className="text-xs leading-relaxed text-sky-900/90 dark:text-sky-100/80">{plan.ski.notes}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={IKON_DESTINATIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-blue-950 bg-blue-950 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-blue-900"
                >
                  Check Ikon destinations
                </a>
                <a
                  href={EPIC_DESTINATIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#2D0A63] bg-[#2D0A63] px-3 py-1.5 text-xs font-semibold text-[#FF5722] hover:bg-[#3A1178]"
                >
                  Check Epic resorts
                </a>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Weather</h2>
              {plan.weather.source === "typical" && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-100">
                  Typical
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(plan.weather.daily ?? []).map((w) => (
                <div
                  key={w.date}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {formatShortDate(w.date)}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-zinc-900 dark:text-zinc-50">{formatTemp(w.tempMaxC)}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Low {formatTemp(w.tempMinC)}</p>
                  {plan.weather.source !== "typical" && (
                    <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {weatherTone(w.precipMm)} · {w.precipMm.toFixed(1)} mm
                    </p>
                  )}
                </div>
              ))}
            </div>
            {(plan.weather.daily ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Weather boxes will appear after the planner finds the destination.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Airport</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                plan.flights.origin ?? { code: HOME_AIRPORT, name: HOME_AIRPORT_NAME },
                plan.flights.destination ?? { code: "?", name: "Airport name unavailable" },
              ].map((airport) => (
                <div
                  key={airport.code}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{airport.code}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{airport.name}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    oneworld combinations
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {HOME_AIRPORT} to {plan.flights.destination?.code ?? "?"}
                  </p>
                </div>
                <p className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {plan.flights.oneworld?.total ?? 0}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Direct", plan.flights.oneworld?.direct ?? 0],
                  ["1 stop", plan.flights.oneworld?.oneStop ?? 0],
                  ["2+ stops", plan.flights.oneworld?.twoPlusStops ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-900">
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
              {plan.flights.oneworld?.carriers.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.flights.oneworld.carriers.slice(0, 6).map((carrier) => (
                    <span
                      key={carrier}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {carrier}
                    </span>
                  ))}
                </div>
              ) : null}
              {plan.flights.oneworld?.sampleRoutes.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {plan.flights.oneworld.sampleRoutes.map((route) => (
                    <p
                      key={route}
                      className="rounded-lg border border-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      {route}
                    </p>
                  ))}
                </div>
              ) : null}
              {plan.flights.oneworld?.message && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{plan.flights.oneworld.message}</p>
              )}
            </div>
            <a
              href={plan.flights.googleFlightsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
            >
              Open Google Flights with this city pair and dates
            </a>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Attractions</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {plan.attractions.map((a) => (
                <li
                  key={`${a.name}-${a.lat}-${a.lon}`}
                  className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{a.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{a.type}</p>
                </li>
              ))}
            </ul>
            {plan.attractions.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No nearby attractions returned.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
