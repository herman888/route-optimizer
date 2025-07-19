import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_POSITION = [43.7, -79.4]; // Toronto

function FitBounds({ geojson }) {
  const map = useMap();
  useEffect(() => {
    if (geojson && geojson.features && geojson.features[0]) {
      const layer = new GeoJSON(geojson);
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
          cursor: "pointer",
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
            cursor: "pointer",
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

  const handle
