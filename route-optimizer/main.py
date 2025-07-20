from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU3YmU3YTEwYTRmMTQ3ZDFhNWIyNTQyYTlmODY2NTFiIiwiaCI6Im11cm11cjY0In0="

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

if __name__ == "__main__":
    app.run(debug=True)
