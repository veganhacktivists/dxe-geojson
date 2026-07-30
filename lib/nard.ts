import axios from "axios";
import { Chapter } from "./geojson";

/** Years of events to publish, counting back from the most recent one listed. */
const YEARS_PUBLISHED = 2;

const SOURCE_URL = "https://thenard.org/";

/** The events map on thenard.org embeds its own config as JSON. */
const CONFIG_PATTERN = /nard-year-explorer__config"[^>]*>(\{.*?\})<\/script>/s;

interface NardLocation {
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface NardYear {
  year: string;
  pageLink?: string;
  locations?: NardLocation[];
}

/**
 * Read the year explorer config out of the NARD homepage.
 *
 * The config carries every year they have run, each with its own page and a
 * list of locations with coordinates, which is everything the map needs.
 */
export async function fetchYears(): Promise<NardYear[]> {
  const res = await axios.get<string>(SOURCE_URL, { responseType: "text" });
  const match = CONFIG_PATTERN.exec(res.data);

  if (!match) {
    throw new Error("No year explorer config found on thenard.org");
  }

  const years = JSON.parse(match[1]).years as NardYear[];

  return years.filter((year) => year.locations?.length);
}

/**
 * Flatten the most recent years into one deduplicated set of events.
 *
 * A city that hosts every year would otherwise appear once per year; the most
 * recent entry wins so its link points at the latest event page.
 */
export function toEvents(years: NardYear[]): Chapter[] {
  const recent = [...years]
    .sort((a, b) => Number(b.year) - Number(a.year))
    .slice(0, YEARS_PUBLISHED);

  const byName = new Map<string, Chapter>();
  let id = 1;

  for (const year of recent) {
    for (const location of year.locations ?? []) {
      const key = location.name.trim().toLowerCase();

      if (byName.has(key)) {
        continue;
      }

      byName.set(key, {
        ID: id++,
        FacebookID: 0,
        Name: location.name.trim(),
        Flag: "",
        FbURL: year.pageLink ?? SOURCE_URL,
        TwitterURL: "",
        InstaURL: "",
        Email: "",
        Region: "",
        Year: year.year,
        Lat: location.lat,
        Lng: location.lng,
      });
    }
  }

  return [...byName.values()];
}
