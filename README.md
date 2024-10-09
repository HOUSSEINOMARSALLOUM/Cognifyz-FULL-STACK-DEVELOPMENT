# Cognifyz-FULL-STACK-DEVELOPMENT
User Submission Form and API Integration
Overview
This is a full-stack Node.js application using Express, MongoDB, Redis, and EJS templating engine. It features a user registration system, user authentication, integration with the OpenWeather API to fetch weather data, and advanced server-side features such as caching, background tasks, and API rate limiting.

Features:
User Registration with age validation and password strength check.
Login System with secure password hashing using bcrypt.
Dynamic Weather Data lookup from OpenWeather API.
Advanced Server-Side Features:
Middleware for logging, validation, and error handling.
Background tasks using cron (daily cleanup).
Redis caching for performance optimization.
Rate limiting for weather API requests
Table of Contents
Installation
Environment Variables
Usage
Run the App
API Endpoints
Features
User Registration
Login System
Weather Data
Advanced Features
Background Tasks
Redis Caching
License
Installation
Clone the Repository:

bash
Copy code
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Install Dependencies:

bash
Copy code
npm install
Ensure MongoDB and Redis are running:

Install and run MongoDB:
bash
Copy code
mongod
Install and run Redis:
bash
Copy code
redis-server
Get an API Key from OpenWeather, and update the environment variable with your API key.

Environment Variables
Create a .env file in the root directory and include the following environment variables:

bash
Copy code
MONGO_URI=mongodb://localhost:27017/userApp  # MongoDB URI
REDIS_URL=redis://localhost:6379             # Redis URL
OPENWEATHER_API_KEY=your-openweather-api-key # Your OpenWeather API key
PORT=3000                                    # Port number
Usage
Run the App
Start the application:

bash
Copy code
npm run dev   # Uses nodemon for auto-reloading
Open in Browser: Visit http://localhost:3000/ to view the app.

API Endpoints
Endpoint	Method	Description
/submit	POST	Register a new user
/login	POST	Log in a user
/api/submissions	GET	Fetch all registered users (with Redis caching)
/weather/:city	GET	Fetch weather data for a given city
Features
User Registration
Users can register by filling out a form with name, email, age, and password.
The password must be at least 8 characters long, contain one uppercase letter, and one number.
The password is hashed using bcrypt before being stored in MongoDB.
Login System
Users can log in with their email and password.
Passwords are compared using bcrypt to ensure security.
Weather Data
Users can enter a city to fetch weather data from the OpenWeather API.
Rate-limited to 100 requests per 15 minutes.
Advanced Features
Middleware:

Logging: Logs each request to the console.
Validation: Ensures required fields are provided during form submission.
Error Handling: Catches and logs errors, and returns a proper error response.
Background Tasks:

A cron job runs daily at midnight to delete users older than 7 days.
Redis Caching:

API responses for /api/submissions are cached in Redis for 1 hour to reduce database load and speed up response time.
Background Tasks
The app uses cron jobs for scheduled background tasks.

Daily Cleanup: The app automatically deletes users older than 7 days from the database every day at midnight.
The cron job is set up using the node-cron library:

js
Copy code
cron.schedule('0 0 * * *', async () => {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 7);
  await User.deleteMany({ createdAt: { $lt: dateLimit } });
});
Redis Caching
Redis is used to cache the results of API calls to reduce load on the database.

Cache Expiration: Cached data expires after 1 hour.
Cache Hit/Miss: The app first checks Redis before querying MongoDB. If data is found in the cache (cache hit), it's returned immediately. Otherwise, the app queries the database (cache miss), stores the result in Redis, and returns it to the client.
License
This project is licensed under the MIT License.

Final Thoughts
This README.md gives an overview of the project, instructions for setting it up, and details on how to use it. It also explains the key features and how to configure important environment variables
