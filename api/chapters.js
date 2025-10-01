import axios from "axios";
import { toGeoJson } from "../lib/geojson";

/**
 * Fetch DxE chapters and parse the response to JSON.
 */
async function fetchChapters() {
  const res = await axios.get("https://adb.dxe.io/chapters");

  return res.data;
}

/**
 * Fetch DxE chapters and convert them to GeoJSON objects.
 *
 * @todo Set cache headers.
 * @param {Request} _req Standard HTTP request object
 * @param {Response} res Standard HTTP response object
 */
export default async function getChapters(_req, res) {
  try {
    const chapters = await fetchChapters();
    res.status(200).json(chapters.map(toGeoJson));
  } catch (err) {
    res.status(500).json({ error: "" });
  }
}
