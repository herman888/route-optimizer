from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU3YmU3YTEwYTRmMTQ3ZDFhNWIyNTQyYTlmODY2NTFiIiwiaCI6Im11cm11cjY0In0="

# In-memory storage for student and volunteer data
students_data = {}
volunteers_data = {}
student_counter = 1
volunteer_counter = 1

def geocode_location(location):
    url = "https://api.openrouteservice.org/geocode/search"
    headers = {"Authorization": ORS_API_KEY}
    params = {"text": location, "size": 1}
    res = requests.get(url, headers=headers, params=params)
    res.raise_for_status()
    data = res.json()
    coords = data['features'][0]['geometry']['coordinates']
    return coords  # [lon, lat]

def get_route(coordinates, profile="driving-car"):
    url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }
    body = {"coordinates": coordinates}
    res = requests.post(url, headers=headers, json=body)
    res.raise_for_status()
    return res.json()

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/student-signup')
def student_signup():
    return render_template("student_signup.html")

@app.route('/volunteer')
def volunteer():
    return render_template("volunteer.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route('/api/route', methods=['POST'])
def route_api():
    data = request.json
    places = data['places']  # e.g., ["Toronto", "Vaughan", "Markham"]
    try:
        coords = [geocode_location(p) for p in places]
        route = get_route(coords)
        return jsonify(route)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/students', methods=['POST'])
def add_student():
    global student_counter
    try:
        data = request.json
        student_id = f"student_{student_counter}"
        students_data[student_id] = {
            "id": student_id,
            "name": data['name'],
            "email": data['email'],
            "address": data['address'],
            "phone": data['phone'],
            "student_id": data['student_id'],
            "program": data['program'],
            "year": data['year']
        }
        student_counter += 1
        return jsonify({"message": "Student registered successfully!", "id": student_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/volunteers', methods=['POST'])
def add_volunteer():
    global volunteer_counter
    try:
        data = request.json
        volunteer_id = f"volunteer_{volunteer_counter}"
        volunteers_data[volunteer_id] = {
            "id": volunteer_id,
            "name": data['name'],
            "email": data['email'],
            "address": data['address'],
            "phone": data['phone'],
            "availability": data['availability'],
            "vehicle": data['vehicle'],
            "experience": data['experience']
        }
        volunteer_counter += 1
        return jsonify({"message": "Volunteer registered successfully!", "id": volunteer_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/students', methods=['GET'])
def get_students():
    return jsonify(students_data)

@app.route('/api/volunteers', methods=['GET'])
def get_volunteers():
    return jsonify(volunteers_data)

if __name__ == "__main__":
    app.run(debug=True)