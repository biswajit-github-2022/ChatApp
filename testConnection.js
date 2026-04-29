import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8","1.1.1.1"]);


const uri = "mongodb+srv://ranabiswajit911:VXZ7D2T3vKN7i1rR@cluster0.iouiweb.mongodb.net/?appName=Cluster0";

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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
