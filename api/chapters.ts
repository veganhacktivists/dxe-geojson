import axios from "axios";
import { Request, Response } from "express";
import { toGeoJson, Chapter } from "../lib/geojson";

/**
 * Chapters the API reports as online get 0,0, which would otherwise pin them
 * off the coast of Africa. Ones that do meet somewhere are placed here; the
 * rest are left off the map.
 */
const COORDINATES: Record<string, [number, number]> = {
  "Animal Liberation Conference": [38.9072, -77.0369], // Washington, DC
};

/**
 * Fetch DxE chapters and parse the response to JSON.
 */
async function fetchChapters(): Promise<Chapter[]> {
  const res = await axios.get<Chapter[]>("https://adb.dxe.io/chapters");

  return res.data;
}

/**
 * Whether a chapter has coordinates that put it somewhere real.
 */
function isPlaced(chapter: Chapter): boolean {
  return Math.abs(chapter.Lat) > 0.5 || Math.abs(chapter.Lng) > 0.5;
}

/**
 * Apply a known location to a chapter the API left at 0,0.
 */
function place(chapter: Chapter): Chapter {
  const known = COORDINATES[String(chapter.Name)];

  if (!known || isPlaced(chapter)) {
    return chapter;
  }

  return { ...chapter, Lat: known[0], Lng: known[1] };
}

/**
 * Fetch DxE chapters and convert them to GeoJSON objects.
 *
 * @todo Set cache headers.
 * @param {Request} _req Standard HTTP request object
 * @param {Response} res Standard HTTP response object
 */
export default async function getChapters(_req: Request, res: Response) {
  try {
    const chapters = await fetchChapters();

    res.status(200).json(chapters.map(place).filter(isPlaced).map(toGeoJson));
  } catch (err) {
    res.status(500).json({ error: "" });
  }
}
