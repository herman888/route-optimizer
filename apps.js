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

function Sidebar({ show, onClose, summary, onRegister }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: show ? 0 : -240,
        width: 240,
        height: "100%",
        background: "#fff",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        transition: "left 0.3s",
        zIndex: 1000,
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        onClick={onClose}
        style={{
          alignSelf: "flex-end",
          background: "none",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
        }}
        aria-label="Close menu"
      >
        ×
      </button>
      <h3 style={{ marginTop: 10, color: "#1976d2" }}>Menu</h3>
      <button
        style={{
          margin: "12px 0",
          padding: "10px 0",
          background: "#e8f5e9",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          color: "#388e3c",
          cursor: "pointer",
        }}
        onClick={() => alert(summary || "No trip breakdown available.")}
      >
        Trip Breakdowns
      </button>
      <button
        style={{
          margin: "12px 0",
          padding: "10px 0",
          background: "#c8e6c9",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          color: "#388e3c",
          cursor: "pointer",
        }}
        onClick={onRegister}
      >
        Sign Up as a Student in Need
      </button>
    </div>
  );
}

function RegisterPage({ onBack }) {
  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={onBack}
        style={{
          background: "#388e3c",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          marginBottom: 16,
        }}
      >
        ← Back
      </button>
      <h2 style={{ color: "#388e3c" }}>Student Registration</h2>
      <form>
        <input
          type="text"
          placeholder="Full Name"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <input
          type="email"
          placeholder="Email"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <input
          type="text"
          placeholder="School Name"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <button
          type="submit"
          style={{
            background: "#388e3c",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 0",
            width: "100%",
            fontSize: 16,
            marginTop: 12,
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
}

function App() {
  const [start, setStart] = useState("");
  const [midpoint, setMidpoint] = useState("");
  const [end, setEnd] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [summary, setSummary] = useState("");
  const [stopCoords, setStopCoords] = useState([]);
  const [places, setPlaces] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

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

  if (registering) {
    return <RegisterPage onBack={() => setRegistering(false)} />;
  }

  return (
    <div style={{ maxWidth: 480, margin: "auto", padding: 0, position: "relative" }}>
      {/* Top Bar */}
      <div
        style={{
          background: "#388e3c",
          color: "#fff",
          padding: "18px 16px",
          fontSize: 22,
          fontWeight: "bold",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Giveway</span>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: 28,
            cursor: "pointer",
            marginRight: 4,
          }}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>
      {/* Sidebar */}
      <Sidebar
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        summary={summary}
        onRegister={() => {
          setSidebarOpen(false);
          setRegistering(true);
        }}
      />
      {/* Main Content */}
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={start}
            onChange={e => setStart(e.target.value)}
            placeholder="Start location (e.g. York University)"
            style={{ padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <input
            value={midpoint}
            onChange={e => setMidpoint(e.target.value)}
            placeholder="Midpoint (optional)"
            style={{ padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <input
            value={end}
            onChange={e => setEnd(e.target.value)}
            placeholder="End location (e.g. Tim Hortons)"
            style={{ padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button
            onClick={handleRoute}
            style={{
              padding: 12,
              fontSize: 16,
              background: "#388e3c",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              marginTop: 8,
              fontWeight: "bold",
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
    </div>
  );
}

export