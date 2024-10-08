// app.js
const express = require("express");
const mongoose = require("mongoose"); // MongoDB for database
const bcrypt = require("bcrypt"); // For password hashing
const app = express();
const port = 3000;

// Middleware to parse incoming form data (URL-encoded and JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Serve static files from the "public" folder
app.use(express.static("public"));

// Connect to MongoDB (replace 'userApp' with your DB name)
mongoose
  .connect("mongodb://localhost:27017/userApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Mongoose schema for user data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  password: String,
});

// Create a model based on the schema
const User = mongoose.model("User", userSchema);

// Serve the main form page (index.ejs) on the root path
app.get("/", (req, res) => {
  res.render("index"); // Ensure 'index.ejs' is in the 'views' folder
});

// Handle form submission and store data in MongoDB
app.post("/submit", async (req, res) => {
  const { name, email, age, password } = req.body;

  // Validate the form data
  if (!name || !email || !age || age < 18 || !password) {
    return res
      .status(400)
      .send("All fields are required, and you must be at least 18.");
  }

  // Password validation (at least 8 characters, one uppercase letter, one number)
  const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordPattern.test(password)) {
    return res.status(400).send("Invalid password format.");
  }

  // Hash the password before storing it
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user entry in MongoDB
  const newUser = new User({
    name,
    email,
    age,
    password: hashedPassword, // Save hashed password
  });

  await newUser.save(); // Save user in MongoDB
  res.status(201).json(newUser); // Respond with the created user
});

// API to fetch all submitted form data
app.get("/api/submissions", async (req, res) => {
  const users = await User.find(); // Fetch all users from MongoDB
  res.status(200).json(users);
});

// API to delete a submission by ID
app.delete("/api/submissions/:id", async (req, res) => {
  const id = req.params.id;
  await User.findByIdAndDelete(id); // Delete user by ID
  res.status(204).send(); // No content
});

// Handle login request
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send("User not found.");
  }

  // Compare entered password with hashed password in the database
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send("Invalid password.");
  }

  res.send(`Welcome back, ${user.name}!`); // Login successful
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
