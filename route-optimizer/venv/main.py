from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os
import requests
from dotenv import load_dotenv

# Load your .env API keys
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ORS_API_KEY = os.getenv("ORS_API_KEY")

app = FastAPI()

# Input structure
class RouteRequest(BaseModel):
    prompt: str

@app.post("/generate-route/")
def generate_route(data: RouteRequest):
    # Step 1: Use LLM to extract start, stops, end
    llm_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Extract JSON with start, stops (list), and end from user prompt."},
            {"role": "user", "content": data.prompt}
        ]
    )

    try:
        content = llm_response['choices'][0]['message']['content']
        route_data = eval(content)  # Be careful in production
        all_locations = [route_data['start']] + route_data['stops'] + [route_data['end']]
    except Exception as e:
        return {"error": "LLM output not valid", "details": str(e)}

    # Step 2: Geocode locations
    coords = []
    for location in all_locations:
        r = requests.get(
            "https://api.openrouteservice.org/geocode/search",
            params={"api_key": ORS_API_KEY, "text": location}
        )
        features = r.json().get("features")
        if not features:
            return {"error": f"Could not geocode: {location}"}
        lon, lat = features[0]["geometry"]["coordinates"]
        coords.append([lon, lat])

    # Step 3: Get optimized route
    route_r = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        headers={"Authorization": ORS_API_KEY, "Content-Type": "application/json"},
        json={"coordinates": coords}
    )

    if route_r.status_code != 200:
        return {"error": "ORS failed", "details": route_r.text}

    return {
        "locations": all_locations,
        "coordinates": coords,
        "route": route_r.json()
    }
