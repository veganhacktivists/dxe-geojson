import axios from "axios";
import { Request, Response } from "express";
import { toGeoJson, Chapter } from "../lib/geojson";

/**
 * Fetch DxE chapters and parse the response to JSON.
 */
async function fetchChapters(): Promise<Chapter[]> {
  const res = await axios.get<Chapter[]>("https://adb.dxe.io/chapters");

  return res.data;
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
    res.status(200).json(chapters.map(toGeoJson));
  } catch (err) {
    res.status(500).json({ error: "" });
  }
}
