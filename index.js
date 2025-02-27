require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns"); // For optional domain validation (advanced approach)
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

// For parsing POST form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve the front-end
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Example test endpoint
app.get("/api/hello", (req, res) => {
  res.json({ greeting: "hello API" });
});

/**
 * In-memory storage for shortened URLs:
 *  - Each entry is { original_url, short_url }
 *  - 'short_url' is just an incrementing integer in this example
 */
let urlDatabase = [];
let idCounter = 1;

/**
 * Helper function to validate URLs:
 *  - Checks that the URL has a valid protocol (http/https)
 *  - Optionally, you can do a DNS lookup to verify the domain
 */
function isValidHttpUrl(userInput) {
  let url;
  try {
    url = new URL(userInput);
  } catch (_) {
    return false;
  }
  // Check protocol is http or https
  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * POST /api/shorturl
 *  1) Validate the posted URL
 *  2) If valid, store it and return the JSON
 *  3) If invalid, return { error: 'invalid url' }
 */
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validate user-provided URL
  if (!isValidHttpUrl(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // If valid, store and return
  // Check if it's already in our database
  const existingEntry = urlDatabase.find((entry) => entry.original_url === originalUrl);
  if (existingEntry) {
    return res.json({
      original_url: existingEntry.original_url,
      short_url: existingEntry.short_url,
    });
  }

  // Otherwise, add new entry
  const newEntry = {
    original_url: originalUrl,
    short_url: idCounter++
  };
  urlDatabase.push(newEntry);

  res.json({
    original_url: newEntry.original_url,
    short_url: newEntry.short_url,
  });
});

/**
 * GET /api/shorturl/:short
 *  1) Check if :short exists in our database
 *  2) If found, redirect to the original URL
 *  3) If not found, return { error: "invalid url" } or a 404
 */
app.get("/api/shorturl/:short", (req, res) => {
  const shortParam = parseInt(req.params.short);

  // Find the entry by short_url
  const entry = urlDatabase.find((item) => item.short_url === shortParam);

  if (!entry) {
    // You can return an error JSON or just a 404
    return res.json({ error: "invalid url" });
  }

  // Redirect to the original URL
  res.redirect(entry.original_url);
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
