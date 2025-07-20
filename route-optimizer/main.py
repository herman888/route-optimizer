from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# ── OpenRouteService ────────────────────────────────────────────────────────────
ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU3YmU3YTEwYTRmMTQ3ZDFhNWIyNTQyYTlmODY2NTFiIiwiaCI6Im11cm11cjY0In0="   # replace with your real key

def geocode_location(location: str):
    """Return [lon, lat] for a textual place."""
    url = "https://api.openrouteservice.org/geocode/search"
    headers = {"Authorization": ORS_API_KEY}
    params  = {"text": location, "size": 1}
    res     = requests.get(url, headers=headers, params=params)
    res.raise_for_status()
    data = res.json()
    return data["features"][0]["geometry"]["coordinates"]

def get_route(coords, profile: str = "driving-car"):
    """Return a GeoJSON route for an ordered list of [lon,lat] coordinates."""
    url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}
    body    = {"coordinates": coords}
    res     = requests.post(url, headers=headers, json=body)
    res.raise_for_status()
    return res.json()

# ── In‑memory storage (simple demo) ─────────────────────────────────────────────
students_data   = {}
volunteers_data = {}
student_counter   = 1
volunteer_counter = 1

# ── Page views ──────────────────────────────────────────────────────────────────
@app.route("/")                       # splash is now the root
def splash():
    return render_template("splash.html")

@app.route("/app")                    # main map lives here
def main_app():
    return render_template("index.html")

@app.route("/signup")                 # generic single‑page sign‑up form
def signup():
    return render_template("form.html")

@app.route("/student-signup")         # dedicated templates (if you keep them)
def student_signup():
    return render_template("student_signup.html")

@app.route("/volunteer")
def volunteer():
    return render_template("volunteer.html")

@app.route("/login")
def login():
    return render_template("login.html")

# ── Routing API ────────────────────────────────────────────────────────────────
@app.route("/api/route", methods=["POST"])
def route_api():
    data = request.json
    places = data.get("places", [])
    student_ids = data.get("student_ids", [])
    
    try:
        # Get coordinates for start/end points (text addresses)
        coords = []
        
        # First process the start/end locations (text addresses)
        for place in places:
            if isinstance(place, str):  # It's a text address
                coords.append(geocode_location(place))
            elif isinstance(place, list) and len(place) == 2:  # It's already [lon,lat]
                coords.append(place)
        
        # Then add student locations if provided
        if student_ids:
            for student_id in student_ids:
                student = students_data.get(student_id)
                if student and student.get("address"):
                    try:
                        coords.insert(-1, geocode_location(student["address"]))  # Insert before end point
                    except Exception as e:
                        app.logger.error(f"Failed to geocode student {student_id}: {e}")
        
        if len(coords) < 2:
            return jsonify({"error": "Need at least 2 valid locations"}), 400
            
        return jsonify(get_route(coords))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ── Student & Volunteer APIs ───────────────────────────────────────────────────
@app.route("/api/students", methods=["POST"])
def add_student():
    global student_counter
    try:
        data = request.json or {}
        student_id = f"student_{student_counter}"
        students_data[student_id] = {
            "id":         student_id,
            "name":       data.get("name"),
            "email":      data.get("email"),
            "address":    data.get("address"),
            "phone":      data.get("phone"),
            "student_id": data.get("student_id"),
            "program":    data.get("program"),
            "year":       data.get("year"),
        }
        student_counter += 1
        return jsonify({"message": "Student registered successfully!", "id": student_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/volunteers", methods=["POST"])
def add_volunteer():
    global volunteer_counter
    try:
        data = request.json or {}
        volunteer_id = f"volunteer_{volunteer_counter}"
        volunteers_data[volunteer_id] = {
            "id":          volunteer_id,
            "name":        data.get("name"),
            "email":       data.get("email"),
            "address":     data.get("address"),
            "phone":       data.get("phone"),
            "availability":data.get("availability"),
            "vehicle":     data.get("vehicle"),
            "experience":  data.get("experience"),
        }
        volunteer_counter += 1
        return jsonify({"message": "Volunteer registered successfully!", "id": volunteer_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/students", methods=["GET"])
def get_students():
    return jsonify(students_data)

@app.route("/api/volunteers", methods=["GET"])
def get_volunteers():
    return jsonify(volunteers_data)

# ───────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)
