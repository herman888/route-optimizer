import { useEffect } from 'react';
import L from 'leaflet';

function RouteOptimizer() {
  useEffect(() => {
    // Prevent duplicate map initialization
    if (document.getElementById('map')?._leaflet_id != null) return;

    const map = L.map('map').setView([43.7, -79.4], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Additional logic...
  }, []);

  return (
    <div>
      <h1>Route Optimizer</h1>
      <div id="places">
        <input id="start" placeholder="Start location" />
        <input id="midpoint" placeholder="Midpoint (optional)" />
        <input id="end" placeholder="End location" />
        <button id="routeBtn">Get Route</button>
      </div>
      <div id="map" style={{ height: '600px', width: '100%' }} />
    </div>
  );
}

export default RouteOptimizer;
