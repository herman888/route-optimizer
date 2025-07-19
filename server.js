const express = require('express');
const cors = require('cors');
const path = require('path');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static HTML + assets from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to run Python script
app.get('/run-python', (req, res) => {
  // Adjust this to your Python file path
  const scriptPath = path.join(__dirname, 'main.py');

  execFile('python3', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error('Python script error:', error);
      return res.status(500).send('Error running Python script');
    }
    if (stderr) {
      console.error('Python stderr:', stderr);
    }
    res.send(stdout); // send Python script output as response
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
