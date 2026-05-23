const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// -------------------- MONGO SETUP --------------------

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let tutorCollection;
let bookingsCollection;
let userCollection;

// Lazy DB connection (IMPORTANT for Vercel)
async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db("tutorDB");

  tutorCollection = db.collection("tutors");
  bookingsCollection = db.collection("bookings");
  userCollection = db.collection("users");

  console.log("MongoDB connected");
  return db;
}

// Middleware to ensure DB is ready
async function ensureDB(req, res, next) {
  try {
    if (!tutorCollection) {
      await connectDB();
    }
    next();
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).send({ message: "Database connection failed" });
  }
}

// -------------------- ROUTES --------------------

// ROOT
app.get("/", (req, res) => {
  res.send("Server working");
});

// GET ALL TUTORS WITH SEARCH
app.get("/tutors", ensureDB, async (req, res) => {

  try {

    const search = req.query.search || "";

    const query = {
      tutorName: {
        $regex: search,
        $options: "i", // case-insensitive
      },
    };

    const allTutors = await tutorCollection
      .find(query)
      .toArray();

    res.send(allTutors);

  } catch (err) {

    res.status(500).send({
      message: "Failed to fetch tutors",
    });

  }
});

// GET SINGLE TUTOR
app.get("/tutors/:id", ensureDB, async (req, res) => {
  try {
    const tutor = await tutorCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.status(200).json(tutor);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch tutor" });
  }
});


// ADD TUTOR
app.post("/tutors", ensureDB, async (req, res) => {
  try {
    const result = await tutorCollection.insertOne(req.body);

    res.send({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to add tutor" });
  }
});

// UPDATE TUTOR
app.put("/tutors/:id", ensureDB, async (req, res) => {
  try {
    const result = await tutorCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: req.body,
      }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update tutor" });
  }
});

// delete tutor
app.delete("/tutors/:id", async (req, res) => {

    const id = req.params.id;

    const query = { _id: new ObjectId(id) };

    const result = await tutorCollection.deleteOne(query);

    res.send(result);

});

// Available/Feature TUTORS
app.get("/available-tutors", ensureDB, async (req, res) => {
  try {
    const tutors = await tutorCollection.aggregate([
      { $limit: 6 }
    ]).toArray();

    res.send(tutors);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch tutors" });
  }
});

// MY TUTORS
app.get("/my-tutors", ensureDB, async (req, res) => {
  try {
    const result = await tutorCollection
      .find({ created_by: req.query.userId })
      .toArray();

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch" });
  }
});

// ---------------- BOOKINGS ----------------

// CREATE BOOKING
app.post("/bookings", ensureDB, async (req, res) => {
  try {
    const result = await bookingsCollection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });

    res.send({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).send({ message: "Booking failed" });
  }
});

// GET BOOKINGS
app.get("/bookings/student/:studentId", ensureDB, async (req, res) => {
  try {
    const bookings = await bookingsCollection
      .find({ studentId: req.params.studentId })
      .toArray();

    res.send(bookings);
  } catch (err) {
    res.status(500).send({ message: "Failed to get bookings" });
  }
});

// UPDATE BOOKING
app.patch("/bookings/:id", ensureDB, async (req, res) => {
  try {
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to update booking" });
  }
});

// ---------------- USER ----------------

// UPDATE USER
app.put("/users/:id", ensureDB, async (req, res) => {
  try {
    const updated = req.body;

    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name: updated.name,
          email: updated.email,
          image: updated.image,
          phone: updated.phone || "",
        },
      }
    );

    res.send({
      success: true,
      message: "Profile updated",
      result,
    });
  } catch (err) {
    res.status(500).send({ message: "Update failed" });
  }
});

// ---------------- EXPORT ----------------
module.exports = app;