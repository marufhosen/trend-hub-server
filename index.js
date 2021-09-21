const express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
require("dotenv").config();
const admin = require("firebase-admin");
ObjectId = require("mongodb").ObjectId;

const serviceAccount = require("./config/trendhub-319-firebase-adminsdk-mz1ee-a4733ca132.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lvals.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const productsCollection = client
    .db("trendHubDb")
    .collection("trendProducts");
  const orderCollection = client.db("trendHubDb").collection("orders");

  //Add Product-Admin

  app.post("/addProducts", (req, res) => {
    const newProduct = req.body;
    productsCollection.insertOne(newProduct).then((result) => {
      console.log("InsertedCount", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  //Get added products
  app.get("/newProducts", (req, res) => {
    productsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //get products by id
  app.get("/product/:id", (req, res) => {
    productId = new ObjectId(req.params.id);
    productsCollection.find({ _id: productId }).toArray((err, documents) => {
      res.send(documents[0]);
    });
  });

  //customer ordered products
  app.post("/orderedProducts", (req, res) => {
    const customerOrderedProduct = req.body;
    orderCollection.insertOne(customerOrderedProduct).then((result) => {
      console.log("InsertedCount", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  //view ordered products
  app.get("/viewOrderdProducts", (req, res) => {
    orderCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //view orderd products by authentic user
  app.get("/ordered", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail === req.query.email) {
            orderCollection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          } else {
            res.status(401).send("Unauthorized Access");
          }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized Access");
        });
    } else {
      res.status(401).send("Unauthorized Access");
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || port);
