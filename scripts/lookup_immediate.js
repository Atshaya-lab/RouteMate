async function getImmediatePOIs() {
  const lat = 9.57465;
  const lng = 77.68146;

  try {
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node(around:800, ${lat}, ${lng});
        way(around:800, ${lat}, ${lng})["name"];
        way(around:800, ${lat}, ${lng})["building"];
        way(around:800, ${lat}, ${lng})["amenity"];
      );
      out center 30;
    `;
    const res = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery), {
      headers: { 'User-Agent': 'RouteMateApp/1.0' }
    });
    const data = await res.json();
    console.log('--- IMMEDIATE PLACES AROUND GPS (within 800m) ---');
    data.elements?.forEach(el => {
      const name = el.tags?.name || el.tags?.['name:en'] || el.tags?.amenity || el.tags?.building || el.tags?.shop;
      const type = el.tags?.amenity || el.tags?.building || el.tags?.shop || el.tags?.highway || 'Landmark';
      if (name) {
        console.log(`• ${name} [${type}]`);
      }
    });
  } catch (e) {
    console.error('Error fetching immediate POIs:', e.message);
  }
}

getImmediatePOIs();
