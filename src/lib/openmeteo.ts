export type DailyWeather = {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  precipMm: number;
  weatherCode: number;
};

export async function fetchForecastDaily(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<DailyWeather[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", "temperature_2m,precipitation,weathercode");
  url.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Open-Meteo request failed");
  const json = (await res.json()) as {
    daily?: {
      time: string[];
      temperature_2m_min: number[];
      temperature_2m_max: number[];
      precipitation_sum: number[];
      weathercode: number[];
    };
  };
  const d = json.daily;
  if (!d?.time?.length) return [];

  return d.time.map((date, i) => ({
    date,
    tempMinC: d.temperature_2m_min[i] ?? 0,
    tempMaxC: d.temperature_2m_max[i] ?? 0,
    precipMm: d.precipitation_sum[i] ?? 0,
    weatherCode: d.weathercode[i] ?? 0,
  }));
}

function eachDateInclusive(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d = new Date(`${startISO}T12:00:00Z`);
  const end = new Date(`${endISO}T12:00:00Z`);

  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }

  return out;
}

function typicalHighForMonth(lat: number, month: number): number {
  const northern = lat >= 0;
  const seasonalMonth = northern ? month : ((month + 6 - 1) % 12) + 1;
  const seasonalHighs = [2, 4, 8, 14, 20, 25, 28, 27, 23, 16, 9, 4];
  const latitudeAdjustment = Math.max(-8, Math.min(8, (35 - Math.abs(lat)) * 0.25));

  return seasonalHighs[seasonalMonth - 1] + latitudeAdjustment;
}

export function buildTypicalWeatherDaily(lat: number, startDate: string, endDate: string): DailyWeather[] {
  return eachDateInclusive(startDate, endDate).map((date) => {
    const month = new Date(`${date}T12:00:00Z`).getUTCMonth() + 1;
    const tempMaxC = Math.round(typicalHighForMonth(lat, month));
    return {
      date,
      tempMaxC,
      tempMinC: tempMaxC - 8,
      precipMm: 0,
      weatherCode: -1,
    };
  });
}
