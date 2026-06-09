export function getSpotNavUrls(lat, lng) {
  return {
    maps: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    mapsPin: `https://www.google.com/maps?q=${lat},${lng}`,
    streetView: `https://www.google.com/maps?layer=c&cbll=${lat},${lng}`,
    streetViewApi: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
    mapillary: `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=17&focus=map`,
  };
}
