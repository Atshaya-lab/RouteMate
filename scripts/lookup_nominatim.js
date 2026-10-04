async function searchBoundingBox() {
  const lat = 9.57465;
  const lng = 77.68146;
  const delta = 0.01; // ~1km

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=Kalasalingam&limit=15`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RouteMateApp/1.0' } });
    const places = await res.json();
    console.log('--- CAMPUS & IMMEDIATE PLACES FOUND ---');
    places.forEach(p => {
      console.log(`• ${p.display_name} (Lat: ${p.lat}, Lon: ${p.lon})`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

searchBoundingBox();
