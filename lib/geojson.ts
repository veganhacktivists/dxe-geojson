export interface Chapter {
  Lat: number;
  Lng: number;
  [key: string]: unknown;
}

interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: Chapter;
}

/**
 * Convert a chapter to GeoJSON, so it can be used in maps.
 *
 * @param {Chapter} chapter
 */
export function toGeoJson(chapter: Chapter): GeoJsonFeature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [chapter.Lng, chapter.Lat],
    },
    properties: chapter,
  };
}
