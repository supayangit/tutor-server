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
let bookingsCollection;

// START SERVER
// Run locally only
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

module.exports = app;

// CONNECT DATABASE
async function connectDB() {
  try {
    await client.connect();

    const db = client.db("tutorDB");

    tutorCollection = db.collection("tutors");
    bookingsCollection = db.collection("bookings");

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

// GET ALL THE TUTORS
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
    res.status(200).json(tutor);

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

app.put("/tutors/:id", async (req, res) => {

    try {

        const id = req.params.id;

        const updatedTutor = req.body;

        const filter = {
            _id: new ObjectId(id),
        };

        const updatedDoc = {
            $set: {
                tutorName: updatedTutor.tutorName,
                photo: updatedTutor.photo,
                subject: updatedTutor.subject,
                availableDays: updatedTutor.availableDays,
                availableTime: updatedTutor.availableTime,
                hourlyFee: updatedTutor.hourlyFee,
                totalSlot: updatedTutor.totalSlot,
                sessionDate: updatedTutor.sessionDate,
                institution: updatedTutor.institution,
                experience: updatedTutor.experience,
                location: updatedTutor.location,
                teachingMode: updatedTutor.teachingMode,
            },
        };

        const result = await tutorCollection.updateOne(
            filter,
            updatedDoc
        );

        res.send(result);

    } catch (error) {

        console.log(error);

        res.status(500).send({
            success: false,
            message: "Failed to update tutor",
        });

    }

});

app.get("/available-tutors", async (req, res) => {

    try {

        const tutors = await tutorCollection
            .find()
            .limit(6)   // MongoDB $limit equivalent
            .toArray();

        res.send(tutors);

    } catch (err) {

        res.status(500).send({ message: "Failed to fetch tutors" });

    }

});

app.get("/my-tutors", async (req, res) => {
  const userId = req.query.userId;

  const result = await tutorCollection
    .find({ created_by: userId })
    .toArray();

  res.send(result);
});

app.post("/bookings", async (req, res) => {

    try {

        const bookingData = req.body;

        const result = await bookingsCollection.insertOne({
            ...bookingData,
            createdAt: new Date(),
        });

        res.send({
            success: true,
            insertedId: result.insertedId,
            message: "Booking successful",
        });

    } catch (error) {

        console.log(error);

        res.status(500).send({
            success: false,
            message: "Failed to save booking",
        });

    }

});

app.get("/bookings/student/:studentId", async (req, res) => {

    try {

        const studentId = req.params.studentId;

        const bookings = await bookingsCollection
            .find({ studentId })
            .toArray();

        res.send(bookings);

    } catch (error) {

        console.log(error);

        res.status(500).send({
            success: false,
            message: "Failed to get bookings",
        });

    }

});

app.patch("/bookings/:id", async (req, res) => {

    try {

        const id = req.params.id;

        const updatedData = req.body;

        const result = await bookingsCollection.updateOne(
            {
                _id: new ObjectId(id),
            },
            {
                $set: updatedData,
            }
        );

        res.send(result);

    } catch (error) {

        console.error(error);

        res.status(500).send({
            message: "Failed to update booking",
        });

    }


});

app.put("/users/:id", async (req, res) => {

  try {

    const id = req.params.id;

    const updated = req.body;

    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: updated.name,
          email: updated.email,
          image: updated.image,
          phone: updated.phone || ""
        }
      }
    );

    res.send({
      success: true,
      message: "Profile updated",
      updatedUser: updated
    });

  } catch (err) {

    console.error(err);

    res.status(500).send({
      success: false,
      message: "Update failed"
    });

  }

});