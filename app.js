// app.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cron = require('node-cron');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const app = express();
const port = 3000;

// Middleware to parse form data (URL-encoded and JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static files from the "public" folder
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/userApp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Redis setup
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis error:', err));
const CACHE_EXPIRATION = 3600; // Cache for 1 hour

// User schema for MongoDB
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  password: String,
}, { timestamps: true }); // Add timestamps

// Create a User model
const User = mongoose.model('User', userSchema);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Middleware to validate form submission data
const validateFormData = (req, res, next) => {
  const { name, email, age, password } = req.body;
  if (!name || !email || !age || !password) {
    return res.status(400).send('All fields are required.');
  }
  next();
};

// Apply rate limiting to weather API route
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/weather', apiLimiter);

// Serve the main form (index.ejs) on the root path
app.get('/', (req, res) => {
  res.render('index');
});

// Handle form submission, validate data, and save to MongoDB
app.post('/submit', validateFormData, async (req, res) => {
  const { name, email, age, password } = req.body;

  // Password validation
  const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordPattern.test(password)) {
    return res.status(400).send('Invalid password format.');
  }

  // Hash the password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create and save the new user
  const newUser = new User({ name, email, age, password: hashedPassword });
  await newUser.save();

  res.status(201).json(newUser);
});

// API to fetch all submissions with Redis caching
const checkCache = (req, res, next) => {
  redisClient.get('submissions', (err, data) => {
    if (err) throw err;
    if (data) {
      console.log('Cache hit');
      res.status(200).json(JSON.parse(data));
    } else {
      console.log('Cache miss');
      next();
    }
  });
};

app.get('/api/submissions', checkCache, async (req, res) => {
  const users = await User.find();
  redisClient.setex('submissions', CACHE_EXPIRATION, JSON.stringify(users));
  res.status(200).json(users);
});

// Handle login request
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send('User not found.');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send('Invalid password.');
  }

  res.send(`Welcome back, ${user.name}!`);
});

// Fetch weather data from OpenWeather API
app.get('/weather/:city', async (req, res) => {
  const city = req.params.city;
  const apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key

  try {
    const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
    const weatherData = response.data;
    res.status(200).json({
      city: weatherData.name,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).send('Failed to fetch weather data');
  }
});

// Schedule a cron job to delete users older than 7 days
cron.schedule('0 0 * * *', async () => {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 7);

  try {
    const result = await User.deleteMany({ createdAt: { $lt: dateLimit } });
    console.log(`Deleted ${result.deletedCount} old users.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
