// app.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, images) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Temporary storage for form data
let formData = [];

// Serve the form on the root path
app.get('/', (req, res) => {
  res.render('index');
});

// Handle form submission
app.post('/submit', (req, res) => {
  const { name, email, age } = req.body;

  // Server-side validation
  if (!name || !email || !age || age < 18) {
    return res.status(400).send('Invalid form data. You must be at least 18 years old.');
  }

  // Save the validated data in memory
  formData.push({ name, email, age });

  res.send(`Data saved! Thank you, ${name}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
