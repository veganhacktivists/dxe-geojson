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
 * Whether a location can be put on the map.
 *
 * A location the source lists without a name or with coordinates it did not
 * fill in would otherwise become a nameless pin, or one placed at NaN.
 */
function isMappable(location: NardLocation): boolean {
  return (
    Boolean(location?.name?.trim()) &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180
  );
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

  const years = (JSON.parse(match[1]).years ?? []) as NardYear[];
  const usable = years
    .map((year) => ({
      ...year,
      locations: (year.locations ?? []).filter(isMappable),
    }))
    .filter((year) => year.locations.length);

  // Returning nothing would empty the layer on the map, and an empty response
  // is indistinguishable from a page we can no longer read, so treat it as a
  // failure and let the caller fall back.
  if (!usable.length) {
    throw new Error("No years with locations found on thenard.org");
  }

  return usable;
}

/**
 * Reshape a snapshot event to what the map displays.
 *
 * The committed snapshot predates the trimmed property set, so mapping it
 * straight through would put the old thirteen-row popup back and, because the
 * map adds a field for every property it receives, leave those fields behind
 * once the live source recovers.
 */
export function fromSnapshot(event: Record<string, unknown>): Chapter {
  return {
    Name: String(event.Name ?? ""),
    Lat: Number(event.Lat),
    Lng: Number(event.Lng),
    description: String(event.FbURL ?? SOURCE_URL),
  };
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

  for (const year of recent) {
    for (const location of year.locations ?? []) {
      if (!isMappable(location)) {
        continue;
      }

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
        Name: location.name.trim(),
        Lat: location.lat,
        Lng: location.lng,
        description: `National Animal Rights Day ${year.year}\n${page}`,
      });
    }
  }

  return [...byName.values()];
}
