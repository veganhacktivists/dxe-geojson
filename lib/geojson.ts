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
  properties: Record<string, unknown>;
}

/**
 * Convert a chapter to GeoJSON, so it can be used in maps.
 *
 * The map builds its popup from whatever properties arrive, one row per
 * property, so anything left here shows up whether or not it has a value.
 * Coordinates are dropped because the geometry already carries them.
 *
 * @param {Chapter} chapter
 */
export function toGeoJson(chapter: Chapter): GeoJsonFeature {
  const { Lat, Lng, ...properties } = chapter;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [Lng, Lat],
    },
    properties,
  };
}
