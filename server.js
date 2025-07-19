const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to local MongoDB
mongoose.connect("mongodb://localhost:27017/mongodbVSCodePlaygroundDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const addressSchema = new mongoose.Schema({
  name: String,
  address: String,
  lat: Number,
  lon: Number,
});
const Address = mongoose.model("Address", addressSchema);

// Get all addresses
app.get("/api/addresses", async (req, res) => {
  try {
    const addresses = await Address.find({});
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

// Add a new address
app.post("/api/addresses", async (req, res) => {
  try {
    const { name, address, lat, lon } = req.body;
    const newAddress = new Address({ name, address, lat, lon });
    await newAddress.save();
    res.json({ success: true, address: newAddress });
  } catch (err) {
    res.status(400).json({ error: "Failed to add address" });
  }
});

app.listen(5000, () => console.log("Server runninng on port 5000"));