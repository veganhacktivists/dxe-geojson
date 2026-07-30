import { Request, Response } from "express";
import { toGeoJson } from "../lib/geojson";
import { fetchYears, toEvents } from "../lib/nard";
import fallback from "../data/nard.json" with { type: "json" };

/**
 * Get Nard events and convert them to GeoJSON objects.
 *
 * Events come from thenard.org so the map follows their current year without
 * anyone having to update this repository. The committed snapshot is only a
 * fallback for when that request fails.
 *
 * @todo Set cache headers.
 * @param {Request} _req Standard HTTP request object
 * @param {Response} res Standard HTTP response object
 */
export default async function getEvents(_req: Request, res: Response) {
  try {
    const events = toEvents(await fetchYears());

    res.status(200).json(events.map(toGeoJson));
  } catch (err) {
    console.error("Falling back to the committed NARD snapshot:", err);

    res.status(200).json(fallback.map(toGeoJson));
  }
}
