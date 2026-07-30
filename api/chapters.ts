import axios from "axios";
import { Request, Response } from "express";
import { toGeoJson, Chapter } from "../lib/geojson";

/** Give up rather than hold the request open if the API stops responding. */
const TIMEOUT_MS = 10_000;

/**
 * Fetch DxE chapters and parse the response to JSON.
 */
async function fetchChapters(): Promise<Chapter[]> {
  const res = await axios.get<Chapter[]>("https://adb.dxe.io/chapters", {
    timeout: TIMEOUT_MS,
  });

  return res.data;
}

/**
 * Whether a chapter has coordinates that put it somewhere real.
 *
 * Chapters DxE marks as online come back at 0,0, which would otherwise pin
 * them in the Gulf of Guinea. That includes the Animal Liberation Conference,
 * which moves each year — Washington County (Utah) in 2022, Berkeley in 2023,
 * Madison in 2024, Santa Rosa in 2025 — so there is no location to give it.
 */
function isPlaced(chapter: Chapter): boolean {
  return Math.abs(chapter.Lat) > 0.5 || Math.abs(chapter.Lng) > 0.5;
}

/**
 * Reduce a chapter to what the map shows.
 *
 * The popup lists one row per property it receives, so `FbURL`, `InstaURL` and
 * the rest each leave an empty row wherever a chapter lacks one. Gathering the
 * links into `description` shows only the ones that exist, and dropping the
 * internal identifiers keeps the popup to what a visitor needs.
 */
function forDisplay(chapter: Chapter): Chapter {
  const links = [chapter.FbURL, chapter.InstaURL, chapter.TwitterURL, chapter.Email]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return {
    Name: chapter.Name,
    Lat: chapter.Lat,
    Lng: chapter.Lng,
    description: links.join("\n"),
  };
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

    res
      .status(200)
      .json(chapters.filter(isPlaced).map(forDisplay).map(toGeoJson));
  } catch (err) {
    res.status(500).json({ error: "" });
  }
}
