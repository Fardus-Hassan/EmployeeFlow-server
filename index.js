const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 3000

app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      credentials: true,
    })
  );
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ak5lvkp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



    const UserCollection = client.db("EmployeeFlowDB").collection("UserCollection");




    app.post('/users', async (req, res) => {
      const user = req.body;
      const email = user.email;
      
      try {
          // Check if a user with the same email already exists
          const existingUser = await UserCollection.findOne({ email: email });
  
          if (existingUser) {
              // Email already exists, return an error response
              res.json({ message: 'Email already in use' });
          } else {
              // Email does not exist, proceed to insert the new user
              const result = await UserCollection.insertOne(user);
              res.json(result);
          }
      } catch (error) {
          // Handle any errors that occurred during the process
          res.json({ message: 'An error occurred', error: error.message });
      }
  });
  
    app.get('/users', async (req, res) => {
        const users = await UserCollection.find({}).toArray();
        res.json(users);
    })

    app.get('/users/:email', async (req, res) => {
        const email = req.params.email;
        const user = await UserCollection.findOne({ email: email });
        res.json(user);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('This is EmployeeFlow-server')
})

app.listen(port, () => {
    console.log(`EmployeeFlow-server running on port ${port}`)
})