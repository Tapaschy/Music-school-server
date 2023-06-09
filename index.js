const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.y4h6mjt.mongodb.net/?retryWrites=true&w=majority`;

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

    // database collection
    const usersCollection = client.db("musicfairy").collection("users");
    const classesCollection = client.db("musicfairy").collection("classes");
    const cartCollection = client.db("musicfairy").collection("carts");

// user data
app.get('/users', async (req, res) => {
    const result = await usersCollection.find().toArray();
    res.send(result);
  });

app.post('/users', async (req, res) => {
    const user = req.body;
    const query = { email: user.email }
    const existingUser = await usersCollection.findOne(query);

    if (existingUser) {
      return res.send({ message: 'user already exists' })
    }

    const result = await usersCollection.insertOne(user);
    res.send(result);
  });
// get user role
app.get('/users/role/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email }
    const user = await usersCollection.findOne(query);
    const result = { role: user?.role}
    res.send(result);
  })




//   change user role
app.patch('/users/role/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const { role } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: role
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);

  })


  //set classes
  app.get('/classes', async (req, res) => {
    const result = await classesCollection.find().toArray();
    res.send(result);
  })

  app.post('/classes', async (req, res) => {
    const newClass = req.body;
    const result = await classesCollection.insertOne(newClass)
    res.send(result);
  })
// to get class by email
  app.get('/classes/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email }
    const result = await classesCollection.find(query).toArray();
    res.send(result);
  })
//   for update class


app.get('/classes/updateclass/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const query = {_id: new ObjectId(id) };
    const result = await classesCollection.findOne(query);
    console.log(id);
    res.send(result)
  })

//   updated data on class
app.put('/classes/updateclass/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options={upsert:true};
    const updatedClass = req.body;
    const updateDoc = {
      $set: {
        Instructorname:updatedClass.Instructorname,
        price:updatedClass.price,
        email:updatedClass.email,
        category:updatedClass.category,
        classname:updatedClass.classname,
        seats:updatedClass.seats,
        classurl:updatedClass.classurl,
        status:updatedClass.status,
        photoUrl:updatedClass.photoUrl,
      },
    };

    const result = await classesCollection.updateOne(filter, updateDoc,options);
    res.send(result);

  })
//   updated class status
app.patch('/classes/status/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const  status  = req.body;
    console.log(status);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        status: status.status,
        feedback: status.feedback,
      },
    };

    const result = await classesCollection.updateOne(filter, updateDoc);
    res.send(result);

  })
// carts
app.get('/carts', async (req, res) => {
    const email = req.query.email;

    if (!email) {
      res.send([]);
    }
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });
  
app.post('/carts', async (req, res) => {
    const item = req.body;
    console.log(item);
    const result = await cartCollection.insertOne(item);
    res.send(result);
  });

  app.delete('/carts/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
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
  res.send('Musicfairy Server is running..')
})

app.listen(port, () => {
  console.log(`Musicfairy is running on port ${port}`)
})
