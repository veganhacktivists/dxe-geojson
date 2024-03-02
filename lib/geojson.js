/**
 * Convert a chapter to GeoJSON, so it can be used in maps.
 *
 * @param {Object} chapter
 */
export function toGeoJson(chapter) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [chapter.Lng, chapter.Lat],
    },
    properties: chapter,
  };
}
