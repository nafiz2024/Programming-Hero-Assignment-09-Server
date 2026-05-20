const express = require('express')
const dotenv = require('dotenv')
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
      const authHeader = req?.headers.authorization
      if(!authHeader) {
        return res.status(401).json({message: "Unauthorized"})
      }

      const token = authHeader.split(" ")[1]
      if(!token) {
        return res.status(401).json({message: "Unauthorized"})
      } 

      try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload)
        next()
      } catch (error) {
        return res.status(403).json({ message: "Forbidden" })
      }      
    }

async function run() {
  try {
    // await client.connect();

    const db = client.db("drivenfleet")
    const carCollection = db.collection("cars")
    const bookingCollection = db.collection("bookings")

    app.post('/car', verifyToken, async (req, res) => {
      const carData = req.body
      const result = await carCollection.insertOne(carData)

      res.json(result)
    })

    app.get('/car', verifyToken, async (req, res) => {
      const result = await carCollection.find().toArray();

      res.json(result);
    })

    app.get('/car/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.findOne({ _id: new ObjectId(id) });

      res.json(result);
    })

    app.patch("/car/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;

      const result = await carCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updateData}
      )

      res.json(result);
    })

    app.delete("/car/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.deleteOne({ _id: new ObjectId(id) });
      
      res.json(result);
    })

    app.post("/booking", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)

      res.json(result);
    })

    app.get('/booking', verifyToken, async (req, res) => {
      const result = await bookingCollection.find().toArray();

      res.json(result);
    })

    app.delete("/booking/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });

      res.send(result);
    });

    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server is running fine!")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

