const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const port = 27017;

require('dotenv').config()

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shttn.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
  const serviceAccount = require("./configs/burj-al-arab-uae-2021-firebase-adminsdk-b6ch7-581df91b7e.json");

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});
const bookingCollection = client.db("burjAlArab").collection("bookings");

client.connect((err) => {
  app.post("/addBookings", (req, res) => {
    const newBookings = req.body;
    bookingCollection
      .insertOne(newBookings)
      .then((result) => res.send(result.insertedCount > 0));
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;

    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;

          if (tokenEmail === queryEmail) {
            bookingCollection
              .find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send("Unauthorized Access!!");
          }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized Access!!");
        });
    } else {
      res.status(401).send("Unauthorized Access!!");
    }
  });
});

app.listen(port);
