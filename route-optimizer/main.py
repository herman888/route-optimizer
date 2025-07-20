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
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Validate and format coordinates
    validated_coords = []
    for coord in coords:
        if isinstance(coord, list) and len(coord) == 2:
            lon, lat = coord
            # Ensure coordinates are numbers and within valid ranges
            if (isinstance(lon, (int, float)) and isinstance(lat, (int, float)) and
                -180 <= lon <= 180 and -90 <= lat <= 90):
                validated_coords.append([float(lon), float(lat)])
    
    if len(validated_coords) < 2:
        raise ValueError("Need at least 2 valid coordinates")
    
    body = {
        "coordinates": validated_coords,
        "instructions": "false",
        "geometry": "true"
    }
    
    try:
        res = requests.post(url, headers=headers, json=body, timeout=10)
        res.raise_for_status()
        return res.json()
    except requests.exceptions.RequestException as e:
        app.logger.error(f"ORS API Error: {str(e)}")
        if e.response:
            app.logger.error(f"Response content: {e.response.text}")
        raise

@app.route("/api/route", methods=["POST"])
def route_api():
    data = request.json
    places = data.get("places", [])
    student_ids = data.get("student_ids", [])
    
    try:
        if len(places) != 2:
            return jsonify({"error": "Exactly 2 places (start and end) required"}), 400
        
        # Get coordinates for start and end points
        start = places[0]
        end = places[1]
        
        # Validate start/end are either strings or valid coordinates
        start_coord = (geocode_location(start) if isinstance(start, str) 
                      else validate_coordinate(start))
        end_coord = (geocode_location(end) if isinstance(end, str) 
                    else validate_coordinate(end))
        
        if not start_coord or not end_coord:
            return jsonify({"error": "Invalid start or end location"}), 400
        
        # Get student coordinates
        student_coords = []
        if student_ids:
            for student_id in student_ids:
                student = students_data.get(student_id)
                if student and student.get("address"):
                    try:
                        coord = geocode_location(student["address"])
                        student_coords.append(coord)
                    except Exception as e:
                        app.logger.error(f"Failed to geocode student {student_id}: {e}")
                        continue
        
        # Combine coordinates: start -> students -> end
        all_coords = [start_coord] + student_coords + [end_coord]
        
        return jsonify(get_route(all_coords))
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def validate_coordinate(coord):
    """Validate and format a coordinate pair"""
    if (isinstance(coord, list) and len(coord) == 2 and
        all(isinstance(x, (int, float)) for x in coord) and
        -180 <= coord[0] <= 180 and -90 <= coord[1] <= 90):
        return [float(coord[0]), float(coord[1])]
    return None
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
