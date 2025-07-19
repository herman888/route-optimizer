import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_POSITION = [43.7, -79.4]; // Toronto
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU3YmU3YTEwYTRmMTQ3ZDFhNWIyNTQyYTlmODY2NTFiIiwiaCI6Im11cm11cjY0In0=";

function FitBounds({ geojson }) {
  const map = useMap();
  React.useEffect(() => {
    if (geojson && geojson.features && geojson.features[0]) {
      const bounds = [];
      if (geojson.features[0].geometry && geojson.features[0].geometry.coordinates) {
        geojson.features[0].geometry.coordinates.forEach(coord => {
          bounds.push([coord[1], coord[0]]);
        });
        if (bounds.length > 0) {
          map.fitBounds(bounds);
        }
      }
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
        left: show ? 0 : -280,
        width: 280,
        height: "100%",
        background: "#fff",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        transition: "left 0.3s",
        zIndex: 1000,
        padding: 20,
        display: show ? "flex" : "none",
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
        Trip Breakdown
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
        Student Registration
      </button>
    </div>
  );
}

function RegisterPage({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.school) {
      alert('Please fill in all fields');
      return;
    }
    alert(`Registration submitted for ${formData.name}!`);
    setFormData({ name: '', email: '', school: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
      <div>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full Name"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <input
          type="text"
          name="school"
          value={formData.school}
          onChange={handleChange}
          placeholder="School Name"
          style={{ display: "block", margin: "12px 0", padding: 10, width: "100%" }}
        />
        <button
          onClick={handleSubmit}
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
      </div>
    </div>
  );
}

function App() {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [midpoints, setMidpoints] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [summary, setSummary] = useState("");
  const [stopCoords, setStopCoords] = useState([]);
  const [places, setPlaces] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState("natural"); // "natural" or "manual"
  const [parsedQuery, setParsedQuery] = useState(null);

  // Add a new midpoint
  const addMidpoint = () => {
    setMidpoints([...midpoints, ""]);
  };

  // Remove a midpoint
  const removeMidpoint = (index) => {
    const newMidpoints = midpoints.filter((_, i) => i !== index);
    setMidpoints(newMidpoints);
  };

  // Update midpoint value
  const updateMidpoint = (index, value) => {
    const newMidpoints = [...midpoints];
    newMidpoints[index] = value;
    setMidpoints(newMidpoints);
  };

  // Natural language processing (will call backend)
  const processNaturalLanguage = async () => {
    if (!naturalLanguageQuery.trim()) {
      alert("Please enter your route request in natural language.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/parse-natural-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: naturalLanguageQuery }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert("Failed to parse request: " + (err.error || "Unknown error"));
        return;
      }

      const parsed = await response.json();
      setParsedQuery(parsed);
      
      // Auto-populate the manual inputs
      setStartLocation(parsed.start_location || "");
      setEndLocation(parsed.end_location || "");
      setMidpoints(parsed.midpoints || []);
      
      // Show what was understood
      alert(`Understood: From "${parsed.start_location}" to "${parsed.end_location}"` + 
            (parsed.midpoints && parsed.midpoints.length > 0 ? ` via ${parsed.midpoints.join(", ")}` : ""));

    } catch (error) {
      alert("Error processing natural language: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced route calculation with multiple midpoints
  const handleRouteCalculation = async () => {
    const start = startLocation.trim();
    const end = endLocation.trim();
    const validMidpoints = midpoints.filter(m => m.trim() !== "");

    if (!start || !end) {
      alert("Please enter at least start and end locations.");
      return;
    }

    // Build the complete route with all stops
    const allPlaces = [start, ...validMidpoints, end];
    setPlaces(allPlaces);
    setLoading(true);

    try {
      const response = await fetch("/api/calculate-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          places: allPlaces,
          preferences: parsedQuery?.preferences || {},
          constraints: parsedQuery?.constraints || {}
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert("Failed to calculate route: " + (err.error || "Unknown error"));
        return;
      }

      const routeResult = await response.json();
      setRouteData(routeResult.route);
      setSummary(routeResult.summary);
      setStopCoords(routeResult.stop_coordinates);

    } catch (error) {
      alert("Error calculating route: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (registering) {
    return <RegisterPage onBack={() => setRegistering(false)} />;
  }

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 0, position: "relative" }}>
      {/* Top Navigation Bar */}
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
        <span>AI Route Planner</span>
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

      <Sidebar
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        summary={summary}
        onRegister={() => {
          setSidebarOpen(false);
          setRegistering(true);
        }}
      />

      <div style={{ padding: 16 }}>
        {/* Input Mode Toggle */}
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <button
            onClick={() => setInputMode("natural")}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: inputMode === "natural" ? "#388e3c" : "#f5f5f5",
              color: inputMode === "natural" ? "#fff" : "#666",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Natural Language
          </button>
          <button
            onClick={() => setInputMode("manual")}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: inputMode === "manual" ? "#388e3c" : "#f5f5f5",
              color: inputMode === "manual" ? "#fff" : "#666",
              border: "1px solid #ddd",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Manual Entry
          </button>
        </div>

        {inputMode === "natural" ? (
          /* Natural Language Input */
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={naturalLanguageQuery}
              onChange={e => setNaturalLanguageQuery(e.target.value)}
              placeholder="Describe your route in natural language... 
Example: 'I need to go from York University to downtown Toronto, stopping by a coffee shop and avoiding highways'"
              style={{
                width: "100%",
                height: 100,
                padding: 12,
                fontSize: 14,
                borderRadius: 6,
                border: "1px solid #ccc",
                resize: "vertical",
                fontFamily: "Arial, sans-serif"
              }}
              disabled={loading}
            />
            <button
              onClick={processNaturalLanguage}
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                background: loading ? "#ccc" : "#2196f3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                marginTop: 8,
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Processing..." : "Parse Request"}
            </button>
          </div>
        ) : (
          /* Manual Location Input */
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <input
              value={startLocation}
              onChange={e => setStartLocation(e.target.value)}
              placeholder="Start location (e.g., York University)"
              style={{
                padding: 10,
                fontSize: 16,
                borderRadius: 6,
                border: "1px solid #ccc",
                outline: "none",
              }}
              disabled={loading}
            />

            {/* Dynamic Midpoints */}
            {midpoints.map((midpoint, index) => (
              <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={midpoint}
                  onChange={e => updateMidpoint(index, e.target.value)}
                  placeholder={`Midpoint ${index + 1} (e.g., Coffee shop)`}
                  style={{
                    flex: 1,
                    padding: 10,
                    fontSize: 16,
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    outline: "none",
                  }}
                  disabled={loading}
                />
                <button
                  onClick={() => removeMidpoint(index)}
                  style={{
                    background: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={addMidpoint}
              style={{
                padding: "8px 16px",
                background: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                alignSelf: "flex-start",
              }}
              disabled={loading}
            >
              + Add Midpoint
            </button>

            <input
              value={endLocation}
              onChange={e => setEndLocation(e.target.value)}
              placeholder="End location (e.g., Tim Hortons Downtown)"
              style={{
                padding: 10,
                fontSize: 16,
                borderRadius: 6,
                border: "1px solid #ccc",
                outline: "none",
              }}
              disabled={loading}
            />
          </div>
        )}

        {/* Calculate Route Button */}
        <button
          onClick={handleRouteCalculation}
          disabled={loading || (!startLocation && !naturalLanguageQuery)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            background: loading ? "#ccc" : "#388e3c",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 16,
          }}
        >
          {loading ? "Calculating Route..." : "Calculate Optimal Route"}
        </button>

        {/* Route Summary */}
        <div style={{
          margin: "12px 0",
          fontSize: "1.1em",
          textAlign: "center",
          color: "#388e3c",
          fontWeight: "500",
          minHeight: "1.5em"
        }}>
          {summary}
        </div>

        {/* Interactive Map */}
        <div style={{
          height: 400,
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <MapContainer
            center={DEFAULT_POSITION}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
            {routeData && (
              <GeoJSON
                data={routeData}
                style={{
                  color: "#2196f3",
                  weight: 4,
                  opacity: 0.8
                }}
              />
            )}
            {routeData && <FitBounds geojson={routeData} />}
            {stopCoords.map((coord, idx) => (
              <CircleMarker
                key={idx}
                center={[coord[1], coord[0]]}
                radius={idx === 0 ? 15 : idx === stopCoords.length - 1 ? 15 : 10}
                color={idx === 0 ? "#4caf50" : idx === stopCoords.length - 1 ? "#f44336" : "#ff9800"}
                fillColor={idx === 0 ? "#4caf50" : idx === stopCoords.length - 1 ? "#f44336" : "#ff9800"}
                fillOpacity={0.8}
                weight={2}
              >
                <title>{places[idx]} {idx === 0 ? "(Start)" : idx === stopCoords.length - 1 ? "(End)" : "(Stop)"}</title>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
