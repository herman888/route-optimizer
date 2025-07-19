from flask import Flask, render_template, request, jsonify
import requests
from pymongo import MongoClient

app = Flask(__name__)

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImU3YmU3YTEwYTRmMTQ3ZDFhNWIyNTQyYTlmODY2NTFiIiwiaCI6Im11cm11cjY0In0="  # Replace with your actual API key

def geocode_location(location):
    url = "https://api.openrouteservice.org/geocode/search"
    headers = {"Authorization": ORS_API_KEY}
    params = {"text": location, "size": 1}
    res = requests.get(url, headers=headers, params=params)
    res.raise_for_status()
    data = res.json()
    if not data['features']:
        raise ValueError(f"Location not found: {location}")
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

@app.route('/api/route', methods=['POST'])
def route_api():
    data = request.json
    places = data.get('places', [])
    if len(places) < 2:
        return jsonify({"error": "At least two places are required"}), 400
    try:
        coords = [geocode_location(p) for p in places]
        route = get_route(coords)
        return jsonify(route)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/addresses')
def get_addresses():
    client = MongoClient("mongodb://localhost:27017")
    db = client["mongodbVSCodePlaygroundDB"]  # Use your playground DB name
    addresses = list(db["addresses"].find({}, {"_id": 0, "lat": 1, "lon": 1, "name": 1}))
    client.close()
    # Filter out any addresses missing lat/lon
    addresses = [a for a in addresses if "lat" in a and "lon" in a]
    return jsonify(addresses)

if __name__ == "__main__":
    app.run(debug=True)