import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_POSITION = [43.7, -79.4]; // Toronto

function FitBounds({ geojson }) {
  const map = useMap();
  React.useEffect(() => {
    if (geojson && geojson.features && geojson.features[0]) {
      const layer = new GeoJSON({ data: geojson });
      map.fitBounds(layer.getBounds());
    }
  }, [geojson, map]);
  return null;
}

function App() {
  const [start, setStart] = useState("");
  const [midpoint, setMidpoint] = useState("");
  const [end, setEnd] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [summary, setSummary] = useState("");
  const [stopCoords, setStopCoords] = useState([]);
  const [places, setPlaces] = useState([]);

  const handleRoute = async () => {
    if (!start || !end) {
      alert("Please enter at least start and end locations.");
      return;
    }
    const inputPlaces = midpoint ? [start, midpoint, end] : [start, end];
    setPlaces(inputPlaces);

    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: inputPlaces }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert("Failed to get route: " + (err.error || "Unknown error"));
        return;
      }
      const data = await response.json();
      setRouteData(data);

      // Summary
      if (
        data &&
        data.features &&
        data.features[0] &&
        data.features[0].properties &&
        data.features[0].properties.summary
      ) {
        const s = data.features[0].properties.summary;
        setSummary(
          `Distance: ${(s.distance / 1000).toFixed(2)} km | Estimated Time: ${(s.duration / 60).toFixed(1)} min`
        );
      } else {
        setSummary("");
      }

      // Stop coordinates
      if (
        data &&
        data.features &&
        data.features[0] &&
        data.features[0].geometry &&
        data.features[0].geometry.coordinates
      ) {
        const routeCoords = data.features[0].geometry.coordinates;
        let stops = [];
        if (inputPlaces.length === 2) {
          stops = [routeCoords[0], routeCoords[routeCoords.length - 1]];
        } else if (inputPlaces.length === 3) {
          stops = [
            routeCoords[0],
            routeCoords[Math.floor(routeCoords.length / 2)],
            routeCoords[routeCoords.length - 1],
          ];
        }
        setStopCoords(stops);
      } else {
        setStopCoords([]);
      }
    } catch (err) {
      alert("Error fetching route: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "auto", padding: 10 }}>
      <h2 style={{ textAlign: "center" }}>Route Optimizer</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={start}
          onChange={e => setStart(e.target.value)}
          placeholder="Start location (e.g. York University)"
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          value={midpoint}
          onChange={e => setMidpoint(e.target.value)}
          placeholder="Midpoint (optional)"
          style={{ padding: 10, fontSize: 16 }}
        />
        <input
          value={end}
          onChange={e => setEnd(e.target.value)}
          placeholder="End location (e.g. Tim Hortons)"
          style={{ padding: 10, fontSize: 16 }}
        />
        <button
          onClick={handleRoute}
          style={{
            padding: 12,
            fontSize: 16,
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            marginTop: 8,
          }}
        >
          Get Route
        </button>
      </div>
      <div style={{ margin: "12px 0", fontSize: "1.1em", textAlign: "center" }}>{summary}</div>
      <div style={{ height: 400, width: "100%", borderRadius: 8, overflow: "hidden" }}>
        <MapContainer center={DEFAULT_POSITION} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {routeData && <GeoJSON data={routeData} style={{ color: "blue", weight: 4 }} />}
          {routeData && <FitBounds geojson={routeData} />}
          {stopCoords.map((coord, idx) => (
            <CircleMarker
              key={idx}
              center={[coord[1], coord[0]]}
              radius={12}
              color="red"
              fillColor="#f03"
              fillOpacity={0.7}
            >
              <title>{`Stop ${idx + 1}: ${places[idx]}`}</title>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
