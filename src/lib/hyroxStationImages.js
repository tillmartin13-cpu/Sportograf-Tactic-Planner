// Add filenames here after uploading images to public/hyrox/stations/{id}/
// Supported formats: .jpg, .jpeg, .png, .webp
// Max 4 images per station recommended

export const HYROX_STATION_IMAGES = {
  start:     [],
  run:       [],
  skierg:    [],
  sled_push: [],
  sled_pull: ['1.jpg', '2.jpg', '3.jpg'],
  burpee:    [],
  rowing:    [],
  farmers:   [],
  sandbag:   ['1.jpg', '2.jpg', '3.jpg'],
  wallball:  [],
  finish:    ['1.jpg', '2.jpg', '3.jpg'],
};

export function getStationImages(stationId) {
  const files = HYROX_STATION_IMAGES[stationId] || [];
  return files.map((f) => `/hyrox/stations/${stationId}/${f}`);
}
