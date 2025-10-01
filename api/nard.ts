import { Request, Response } from "express";
import { toGeoJson } from "../lib/geojson";
import events from "../data/nard.json" with { type: "json" };

/**
 * Get Nard events and convert them to GeoJSON objects.
 *
 * @todo Set cache headers.
 * @param {Request} _req Standard HTTP request object
 * @param {Response} res Standard HTTP response object
 */
export default async function getEvents(_req: Request, res: Response) {
  try {
    res.status(200).json(events.map(toGeoJson));
  } catch (err) {
    res.status(500).json({ error: "" });
  }
}
