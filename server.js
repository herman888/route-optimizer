const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/routeOptimizer?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  address: String,
  school: String,
  registeredDate: Date,
  lastPackageDate: Date
});

const User = mongoose.model('User', userSchema);

// POST route to create a new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save user' });
  }
});

// GET route to fetch all users (optional for viewing later)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
