import axios from "axios";
import { Chapter } from "./geojson";

/** Years of events to publish, counting back from the most recent one listed. */
const YEARS_PUBLISHED = 2;

const SOURCE_URL = "https://thenard.org/";

/** Give up rather than hold the request open if the source stops responding. */
const TIMEOUT_MS = 10_000;

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
  const res = await axios.get<string>(SOURCE_URL, {
    responseType: "text",
    timeout: TIMEOUT_MS,
  });
  const match = CONFIG_PATTERN.exec(res.data);

  if (!match) {
    throw new Error("No year explorer config found on thenard.org");
  }

  const years = JSON.parse(match[1]).years as NardYear[];

  return years.filter((year) => year.locations?.length);
}

/** The same country is written differently from one year to the next. */
const COUNTRY_ALIASES: Record<string, string> = {
  uk: "united kingdom",
  usa: "united states",
  us: "united states",
  uae: "united arab emirates",
};

/**
 * A comparable key for a location, so "London, UK" and "London, United
 * Kingdom" are recognised as the same place while "London, Canada" is not.
 */
function locationKey(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(",")
    .map((part) => part.replace(/[^a-z ]/g, "").trim())
    .filter(Boolean);

  return parts.map((part) => COUNTRY_ALIASES[part] ?? part).join(", ");
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
  const seenPlaces = new Set<string>();
  let id = 1;

  for (const year of recent) {
    for (const location of year.locations ?? []) {
      const key = locationKey(location.name);
      // Identical coordinates mean the same place spelled two ways — "Tucson,
      // AZ" and "Tuscon, AZ" are both listed. Nearby-but-distinct towns keep
      // their own pins because their coordinates differ.
      const place = `${location.lat},${location.lng}`;

      if (byName.has(key) || seenPlaces.has(place)) {
        continue;
      }

      seenPlaces.add(place);

      const page = year.pageLink ?? SOURCE_URL;

      byName.set(key, {
        ID: id++,
        FacebookID: 0,
        Name: location.name.trim(),
        Flag: "",
        FbURL: page,
        TwitterURL: "",
        InstaURL: "",
        Email: "",
        Region: "",
        Lat: location.lat,
        Lng: location.lng,
        description: `National Animal Rights Day ${year.year}\n${page}`,
      });
    }
  }

  return [...byName.values()];
}
