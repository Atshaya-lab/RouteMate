async function getNearbyPOIs() {
  const lat = 9.57467;
  const lng = 77.68146;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'User-Agent': 'RouteMateApp/1.0' }
    });
    const data = await res.json();
    console.log('📍 Real Current Address Details:');
    console.log(JSON.stringify(data.address, null, 2));
    console.log('📍 Full Name:', data.display_name);
  } catch (e) {
    console.log('Geocoding error:', e.message);
  }

  // Also query search for nearby landmarks within Sivakasi / Virudhunagar region
  try {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=Sivakasi&limit=10`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'RouteMateApp/1.0' }
    });
    const places = await searchRes.json();
    console.log('\n🏛️ Regional Landmarks:');
    places.forEach(p => console.log(` - ${p.display_name} (${p.lat}, ${p.lon})`));
  } catch (e) {
    console.log('Search error:', e.message);
  }
}

getNearbyPOIs();
