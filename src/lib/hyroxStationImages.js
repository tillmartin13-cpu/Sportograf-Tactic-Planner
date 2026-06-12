// Add filenames here after uploading images to public/hyrox/stations/{id}/
// Supported formats: .jpg, .jpeg, .png, .webp
// Max 4 images per station recommended

export const HYROX_STATION_IMAGES = {
  start:     [],
  run:       [],
  skierg:    [],
  sled_push: [],
  sled_pull: [],
  burpee:    [],
  rowing:    [],
  farmers:   [],
  sandbag:   [],
  wallball:  [],
  finish:    [],
};

export function getStationImages(stationId) {
  const files = HYROX_STATION_IMAGES[stationId] || [];
  return files.map((f) => `/hyrox/stations/${stationId}/${f}`);
}
