// app.js
const express = require("express");
const mongoose = require("mongoose"); // Import mongoose
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/userApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Middleware to parse incoming form data (URL-encoded and JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static("public"));

// Define Mongoose schema for form submissions
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  password: String,
});

// Create a model from the schema
const User = mongoose.model("User", userSchema);

// Handle form submission and store data in MongoDB
app.post("/submit", async (req, res) => {
  const { name, email, age, password } = req.body;

  // Server-side validation
  if (!name || !email || !age || age < 18 || !password) {
    return res
      .status(400)
      .send("All fields are required, and you must be at least 18.");
  }

  // Password validation: at least 8 characters, one uppercase letter, one number
  const passwordPattern = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordPattern.test(password)) {
    return res.status(400).send("Invalid password format.");
  }

  // Hash the password using bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Save the new user to the database
  const newUser = new User({
    name,
    email,
    age,
    password: hashedPassword, // Save the hashed password
  });

  await newUser.save(); // Save to MongoDB
  res.status(201).json(newUser);
});

// API to fetch all submitted form data
app.get("/api/submissions", async (req, res) => {
  const users = await User.find(); // Fetch users from MongoDB
  res.status(200).json(users);
});

// API to delete a submission by ID
app.delete("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id); // Delete the user by ID
  res.status(204).send(); // No content
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send("User not found.");
  }

  // Compare the entered password with the hashed password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).send("Invalid password.");
  }

  res.send(`Welcome back, ${user.name}!`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
