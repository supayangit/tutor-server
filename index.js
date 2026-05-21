const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let tutorCollection;

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});

// CONNECT DATABASE
async function connectDB() {
  try {
    await client.connect();

    const db = client.db("tutorDB");

    tutorCollection = db.collection("tutors");

    console.log("MongoDB connected");

  } catch (err) {
    console.error("Mongo error:", err);
  }
}

connectDB();

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("Server working");
});

// GET ALL TUTORS
app.get("/tutors", async (req, res) => {
  try {

    if (!tutorCollection) {
      return res.status(500).send("DB not ready");
    }

    const allTutors = await tutorCollection.find().toArray();

    res.send(allTutors);

  } catch (err) {
    console.error(err);

    res.status(500).send({
      success: false,
      message: "Failed to fetch tutors",
    });
  }
});

app.get("/tutors/:id", async (req, res) => {

    const id = req.params.id;

    const tutor = await tutorCollection.findOne({
        _id: new ObjectId(id),
    });

    res.send(tutor);

});

// ADD TUTOR
app.post("/tutors", async (req, res) => {
  try {

    if (!tutorCollection) {
      return res.status(500).send("DB not ready");
    }

    const newTutor = req.body;

    const result = await tutorCollection.insertOne(newTutor);

    console.log("Inserted tutor:", result);

    res.send({
      success: true,
      insertedId: result.insertedId,
      message: "Tutor added successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).send({
      success: false,
      message: "Failed to add tutor",
    });
  }
});