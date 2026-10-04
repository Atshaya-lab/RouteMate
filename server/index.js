const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// In-memory Database / PostGIS & Redis simulator
let activeGuides = [
  {
    id: 'guide-001',
    name: 'Achu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    rating: 5.0,
    reviewCount: 248,
    distance: '170m away',
    distanceKm: 0.17,
    eta: '1 min walk',
    pricePerSession: 8,
    languages: ['Tamil (Native)', 'English (Fluent)'],
    location: { latitude: 9.57587, longitude: 77.68246 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Campus & Safe Egress Specialist',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-002',
    name: 'Malar',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    rating: 4.98,
    reviewCount: 195,
    distance: '260m away',
    distanceKm: 0.26,
    eta: '2 min walk',
    pricePerSession: 7.5,
    languages: ['Tamil (Native)', 'English (Fluent)'],
    location: { latitude: 9.57287, longitude: 77.68296 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Neighborhood & Night Walk Escort',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-003',
    name: 'Ashika',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    rating: 4.95,
    reviewCount: 310,
    distance: '330m away',
    distanceKm: 0.33,
    eta: '2 min walk',
    pricePerSession: 8,
    languages: ['Tamil', 'English', 'Malayalam'],
    location: { latitude: 9.57687, longitude: 77.67946 },
    isOnline: true,
    isVerified: true,
    fastResponder: false,
    specialty: 'Transit Hub & Quick Wayfinding Guide',
    modes: ['call', 'chat', 'meetup'],
  },
  {
    id: 'guide-004',
    name: 'Yuva',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 4.92,
    reviewCount: 180,
    distance: '350m away',
    distanceKm: 0.35,
    eta: '3 min walk',
    pricePerSession: 7,
    languages: ['Tamil', 'English', 'Hindi'],
    location: { latitude: 9.57207, longitude: 77.67966 },
    isOnline: true,
    isVerified: true,
    fastResponder: true,
    specialty: 'Fast Responder & Commuter Escort',
    modes: ['call', 'chat', 'meetup'],
  },
];

const activeRequests = new Map();
const activeSessions = new Map();
const waitlistSubscribers = [];
const sosAlerts = [];

const routeTips = [
  {
    id: 'tip-1',
    title: 'Well-Lit Passages',
    description: 'Use Celetná and Karlova thoroughfares instead of dark alleyways after 10 PM.',
    category: 'safety',
    verified: true,
  },
  {
    id: 'tip-2',
    title: 'Direct Metro Connection',
    description: 'Mustek Exit A leads directly to the Line A/B interchange without crossing the tram track.',
    category: 'transit',
    verified: true,
  },
  {
    id: 'tip-3',
    title: 'Verified Safe Haven',
    description: 'Grand Palace Hotel lobby (150m west) has 24/7 bilingual staff and taxi queue.',
    category: 'local_secret',
    verified: true,
  },
  {
    id: 'tip-4',
    title: 'GPS Signal Drop Zone',
    description: 'Tall Gothic stone arches cause GPS jitter. Follow the blue line and look for cobblestone markers.',
    category: 'low_signal',
    verified: true,
  },
];

// Helper: Calculate Distance
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// REST ENDPOINTS

// 1. Nearby Guides Query (PostGIS emulation)
app.get('/api/guides/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat) || 50.0875;
  const lng = parseFloat(req.query.lng) || 14.4211;
  const radiusKm = parseFloat(req.query.radiusKm) || 5.0;

  const results = activeGuides
    .filter((g) => g.isOnline)
    .map((g) => {
      const dist = getDistanceKm(lat, lng, g.location.latitude, g.location.longitude);
      return {
        ...g,
        distanceKm: Math.round(dist * 100) / 100,
        distance: dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)} km away`,
      };
    })
    .filter((g) => g.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ guides: results, totalOnline: activeGuides.filter((g) => g.isOnline).length });
});

// 2. Create Trip Request (Matching Engine Entry)
app.post('/api/requests/create', (req, res) => {
  const { travelerId, travelerName, travelerPhone, travelerAvatar, destination, pickupLocation, mode } = req.body;
  const requestId = 'req-' + Date.now();

  const newRequest = {
    id: requestId,
    travelerId: travelerId || 'traveler-001',
    travelerName: travelerName || 'Alex Morgan',
    travelerPhone: travelerPhone || '+1 (555) 019-2834',
    travelerAvatar: travelerAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhlQT9am7-K9l0E8HNIXDfK0bN-G661Y1zSw-UFYNyTMQaUHJ-UnTEshZ5e_GSF7waHHAfVIk6mwkBilYF1NRPtmRmEO-HNBymTKsB6Zw4UeVuusG_8HIVM2L0N_PVghpHbZFihUulIDYgornlgmUrt7JZERHuXyvwWt6soGX01gwcE6J6UYdWLFymPfUT9QA89rhqbgmQc8yJcvv31-uExTdNtNuQ14cGd-C5i7F7lk8V9reYGwuo',
    destination: destination || 'Mustek Metro Station, Exit A',
    pickupLocation: pickupLocation || { latitude: 50.0875, longitude: 14.4211 },
    status: 'searching',
    searchRadiusKm: 1.0,
    respondingGuides: [],
    selectedMode: mode || 'call',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30000,
  };

  activeRequests.set(requestId, newRequest);

  // Broadcast to online guides
  io.emit('guide:incoming_request', {
    request: newRequest,
    expiresInSeconds: 30,
  });

  // Start automated radius expansion simulation
  simulateRadiusExpansion(requestId);

  res.json({ success: true, request: newRequest });
});

// 3. Radius Expansion Engine (1km -> 3km -> 5km)
function simulateRadiusExpansion(requestId) {
  const req = activeRequests.get(requestId);
  if (!req) return;

  // Expansion Step 1: 1km (Immediate)
  setTimeout(() => {
    const current = activeRequests.get(requestId);
    if (!current || current.status !== 'searching') return;
    current.searchRadiusKm = 1.0;
    current.respondingGuides = activeGuides.slice(0, 1);
    io.to(`request:${requestId}`).emit('request:radius_expanded', {
      radiusKm: 1.0,
      respondingGuides: current.respondingGuides,
    });
  }, 2000);

  // Expansion Step 2: 3km (6 seconds)
  setTimeout(() => {
    const current = activeRequests.get(requestId);
    if (!current || current.status !== 'searching') return;
    current.searchRadiusKm = 3.0;
    current.respondingGuides = activeGuides.slice(0, 3);
    io.to(`request:${requestId}`).emit('request:radius_expanded', {
      radiusKm: 3.0,
      respondingGuides: current.respondingGuides,
    });
  }, 6000);

  // Expansion Step 3: 5km (12 seconds)
  setTimeout(() => {
    const current = activeRequests.get(requestId);
    if (!current || current.status !== 'searching') return;
    current.searchRadiusKm = 5.0;
    current.respondingGuides = activeGuides;
    io.to(`request:${requestId}`).emit('request:radius_expanded', {
      radiusKm: 5.0,
      respondingGuides: current.respondingGuides,
    });
  }, 12000);
}

// 4. Accept Request (by Guide)
app.post('/api/requests/:id/accept', (req, res) => {
  const requestId = req.params.id;
  const { guideId } = req.body;
  const request = activeRequests.get(requestId);

  if (!request) {
    return res.status(404).json({ error: 'Request not found or expired' });
  }

  const guide = activeGuides.find((g) => g.id === guideId) || activeGuides[0];
  const sessionId = 'sess-' + Date.now();

  const newSession = {
    id: sessionId,
    requestId,
    travelerId: request.travelerId,
    guideId: guide.id,
    guide,
    traveler: {
      id: request.travelerId,
      name: request.travelerName,
      avatarUrl: request.travelerAvatar,
      location: request.pickupLocation,
    },
    status: 'active',
    mode: request.selectedMode || 'call',
    startedAt: Date.now(),
    durationSeconds: 0,
    destination: request.destination,
    currentGuideLocation: guide.location,
    currentTravelerLocation: request.pickupLocation,
    audioEncrypted: true,
    beaconActive: true,
  };

  activeSessions.set(sessionId, newSession);
  request.status = 'accepted';

  // Notify traveler via socket
  io.to(`request:${requestId}`).emit('request:accepted', { session: newSession });
  io.emit('session:started', { session: newSession });

  res.json({ success: true, session: newSession });
});

// 5. Directions Polyline Query (Google / Mapbox / OSRM format)
app.get('/api/directions', (req, res) => {
  const originLat = parseFloat(req.query.originLat) || 50.0875;
  const originLng = parseFloat(req.query.originLng) || 14.4211;
  const destLat = parseFloat(req.query.destLat) || 50.0833;
  const destLng = parseFloat(req.query.destLng) || 14.4242;

  // Real coordinate polyline for walking route
  const polyline = [
    { latitude: originLat, longitude: originLng },
    { latitude: originLat - 0.0007, longitude: originLng + 0.0007 },
    { latitude: originLat - 0.002, longitude: originLng + 0.0018 },
    { latitude: originLat - 0.003, longitude: originLng + 0.0026 },
    { latitude: destLat, longitude: destLng },
  ];

  res.json({
    success: true,
    route: {
      origin: { latitude: originLat, longitude: originLng },
      destination: { latitude: destLat, longitude: destLng },
      polyline,
      distanceText: '620m',
      durationText: '7 mins',
      steps: [
        'Head south on Celetná towards Old Town Square (120m)',
        'Turn right onto Železná (200m)',
        'Continue straight onto Havířská towards Mustek (180m)',
        'Arrive at Mustek Metro Station Exit A',
      ],
    },
  });
});

// 6. Route Tips Query
app.get('/api/route-tips', (req, res) => {
  res.json({ tips: routeTips });
});

// 7. Push Notification Waitlist
app.post('/api/notifications/notify-when-available', (req, res) => {
  const { destination, userId, pushToken } = req.body;
  waitlistSubscribers.push({ destination, userId, pushToken, timestamp: Date.now() });
  res.json({ success: true, message: 'Subscribed to guide availability push alerts.' });
});

// 8. Guide Availability Update (Redis/Postgres toggle)
app.post('/api/guides/availability', (req, res) => {
  const { guideId, isOnline } = req.body;
  const guide = activeGuides.find((g) => g.id === guideId);
  if (guide) {
    guide.isOnline = isOnline;
    io.emit('guide:availability_changed', { guideId, isOnline });

    // If guide came online, check waitlist and trigger push notifications
    if (isOnline && waitlistSubscribers.length > 0) {
      io.emit('guide:now_available', { guide });
    }
  }
  res.json({ success: true, guide });
});

// 9. SOS Emergency Trigger
app.post('/api/safety/sos', (req, res) => {
  const { userId, userName, userPhone, location } = req.body;
  const alert = {
    id: 'sos-' + Date.now(),
    userId: userId || 'traveler-001',
    userName: userName || 'Alex Morgan',
    userPhone: userPhone || '+1 (555) 019-2834',
    location: location || { latitude: 50.0875, longitude: 14.4211 },
    timestamp: Date.now(),
    status: 'triggered',
    respondersNotified: 3,
  };
  sosAlerts.push(alert);

  console.log('🚨 EMERGENCY SOS BROADCAST RECEIVED:', alert);
  io.emit('safety:sos_alert', alert);

  res.json({ success: true, alert, message: 'Emergency dispatchers and contacts notified with live coordinates.' });
});

// SOCKET.IO REALTIME EVENTS
io.on('connection', (socket) => {
  socket.on('join:room', (room) => {
    socket.join(room);
  });

  socket.on('session:send_message', (data) => {
    const msg = {
      id: 'msg-' + Date.now(),
      sessionId: data.sessionId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderAvatar: data.senderAvatar,
      text: data.text,
      timestamp: Date.now(),
      isGuide: !!data.isGuide,
    };
    io.to(`session:${data.sessionId}`).emit('session:new_message', msg);
  });

  socket.on('session:location_update', (data) => {
    io.to(`session:${data.sessionId}`).emit('session:peer_location', data);
  });

  socket.on('session:end', (data) => {
    io.to(`session:${data.sessionId}`).emit('session:ended', data);
  });
});

server.listen(PORT, () => {
  console.log(`RouteMate server listening on http://localhost:${PORT}`);
});
