const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.DB_STRIPE_SECRET);
const port = process.env.PORT || 4000

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
    const Contact = client.db("EmployeeFlowDB").collection("Contact");
    const EmployeeWorkSheet = client.db("EmployeeFlowDB").collection("EmployeeWorkSheet");
    const PaymentHistory = client.db("EmployeeFlowDB").collection("PaymentHistory");





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

    app.post("/contact", async (req, res) => {
      const contact = req.body;
      const result = await Contact.insertOne(contact);
      res.json(result);
    })

    app.get('/contact', async (req, res) => {
      const contact = await Contact.find({}).toArray();
      res.json(contact);
    })

    app.get('/users', async (req, res) => {
      const users = await UserCollection.find({}).toArray();
      res.json(users);
    })

    // make verify
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const user = req.body


      try {
        const result = await UserCollection.updateOne({ _id: new ObjectId(id) }, { $set: { verify: user.verify } });
        res.json(result);
      } catch (error) {
        console.error('Failed to update verification status:', error);
        res.status(500).json({ error: 'Failed to update verification status' });
      }
    });

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await UserCollection.findOne({ email: email });
      res.json(user);
    })


    // update salary
    app.patch('/users/updateSalary/:email', async (req, res) => {
      const email = req.params.email;
      const { salary } = req.body;


      try {
        const updateSalary = await UserCollection.updateOne({ email: email }, { $set: { salary: salary } });

        if (updateSalary.matchedCount === 0) {  // Change here
          return res.status(404).send('User not found');
        }

        res.status(200).send(updateSalary);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error updating salary');
      }


    });


    // Work-Sheet

    app.post("/employeeWorkSheet", async (req, res) => {
      const employeeWorkSheet = req.body;
      const result = await EmployeeWorkSheet.insertOne(employeeWorkSheet);
      res.json(result);
    })

    app.get('/employeeWorkSheet', async (req, res) => {
      const employeeWorkSheet = await EmployeeWorkSheet.find({}).toArray();
      res.json(employeeWorkSheet);
    })

    app.get("/employeeWorkSheet/:email", async (req, res) => {
      const email = req.params.email;
      const employeeWorkSheet = await EmployeeWorkSheet.find({ employeeEmail: email }).toArray();
      res.json(employeeWorkSheet);
    });

    app.delete('/employeeWorkSheet/:id', async (req, res) => {
      const id = req.params.id;
      const result = await EmployeeWorkSheet.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    })

    // fired
    app.patch('/users/fired/:email', async (req, res) => {
      const email = req.params.email;
      const { fired } = req.body


      try {
        const firedEmployee = await UserCollection.updateOne({ email: email }, { $set: { fired: fired } }, { $unset: true });

        res.status(200).send(firedEmployee);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fried employee');
      }

    })

    //makeHR
    app.patch('/users/makeHR/:email', async (req, res) => {
      const email = req.params.email;
      const { role } = req.body

      try {
        const makeHR = await UserCollection.updateOne({ email: email }, { $set: { role: role } }, { $unset: true });

        res.status(200).send(makeHR);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error to Make HR');
      }
    });

    //payment

    app.get('/payment-history', async (req, res) => {
      const result = await PaymentHistory.find({}).toArray();
      res.json(result);
    });
    
    app.get('/payment-history/:email', async (req, res) => {
      const email = req.params.email;
      const result = await PaymentHistory.find({ email: email }).toArray();
      res.json(result);
    });

    app.post('/payment-history', async (req, res) => {
      const payment = req.body;
      const result = await PaymentHistory.insertOne(payment);
      res.json(result);
    });

 

    app.post('/create-payment-intent', async (req, res) => {
      const payment = req.body.price;
      const amount = parseFloat(payment)*100;
      if(!payment || amount < 1){
        return 
      }

      const {client_secret} = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      
      })


      res.send({clientSecret : client_secret})

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