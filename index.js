const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

// verify jwt
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized token access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_JWT, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


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
        const paymentCollection = client.db("musicfairy").collection("payments");



        // creating jwt token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_JWT, { expiresIn: '2h' })

            res.send({ token })
        })

        // user data
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // store user login data in database

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

            // if (!email) {
            //     res.send([]);
            // }

            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ error: true, message: 'forbidden access' })
            // }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { role: user?.role }
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

            // todo:if clases give error romove this
            // const result = await classesCollection.find({ status: "approve" }).sort({ enrolled: -1 }).toArray();
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
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.findOne(query);
            console.log(id);
            res.send(result)
        })

        //   updated data on class
        app.put('/classes/updateclass/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedClass = req.body;
            const updateDoc = {
                $set: {
                    Instructorname: updatedClass.Instructorname,
                    price: updatedClass.price,
                    email: updatedClass.email,
                    category: updatedClass.category,
                    classname: updatedClass.classname,
                    seats: updatedClass.seats,
                    classurl: updatedClass.classurl,
                    status: updatedClass.status,
                    photoUrl: updatedClass.photoUrl,
                },
            };

            const result = await classesCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        })
        //   updated class status
        app.patch('/classes/status/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const status = req.body;
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
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;

            if (!email) {
                res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'porviden access' })
            }

            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });
// for adding new carts
        app.post('/carts', async (req, res) => {
            const item = req.body;
            const query = { classId: item.classId }
            const existingclass = await cartCollection.findOne(query);

            if (existingclass) {
                return res.send({ message: 'class  already booked' })
            }
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        });
        // delete cart
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })


        // for payment stripe

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: 'usd',
              payment_method_types: ['card']
            });
      
            res.send({
              clientSecret: paymentIntent.client_secret
            })
          });

// after payment succeed 
    app.post('/payments', verifyJWT, async (req, res) => {
        const payment = req.body;
        const insertResult = await paymentCollection.insertOne(payment);
        const query = { _id: new ObjectId(payment.itemId) } 
        
        console.log(payment.classId);
        const deleteResult = await cartCollection.deleteOne(query);
        // const classId = { _id: new ObjectId(payment.classId) } 
        const enrooledresult = await classesCollection.updateOne(
            { _id: new ObjectId(payment.classId), seats: { $gt: 0 } },
            { $inc: { seats: -1, enrolled: 1 } }
          );
  
        res.send({insertResult,enrooledresult});
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
