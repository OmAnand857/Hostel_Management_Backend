import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import config from "./config.js";
import { createClient } from '@supabase/supabase-js'
import axios from "axios";
import Stripe from "stripe"
import jwt from 'jsonwebtoken';
// Create a single supabase client for interacting with your database

const app = express();
const port = 5173;

const saltRounds = 10;


// CORS handling
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};

app.use(cors(corsOptions));

// parsing the string to json using middleware

app.use(express.json());

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


const stripeSecretKey = config.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey)
const supabase = createClient( config.BASE_URL,  config.BASE_KEY ) 

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post("/create-payment-intent", async (req, res) =>{

    const{ amount , shipping , description , hosteltype , room_id } = req.body;
    const address = {
        city : shipping.city,
        country : "IN",
        line1 : shipping.state,
        line2 : shipping.city,
        postal_code : shipping.pincode,
        state : shipping.state
    }
    const metadata = {
        hosteltype : hosteltype,
        room_id : room_id
    }

    console.log( "BOOM paymnet request received for ---> " , amount )
    try {
    
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount, 
          currency: 'inr', 
          description: description,
          receipt_email : shipping.email,
          shipping:{
            name : shipping.name,
            address : address
          },
          automatic_payment_methods: {
            enabled: true,
          },
          metadata : metadata
        });
    
        // Send the client secret to the frontend
        res.status(200).send({
          clientSecret: paymentIntent.client_secret
        });
      } catch (error) {
        res.status(500).send({
          error: error.message
        });
      }

});

app.get('/get-payment-details/:paymentIntentId', async (req, res) => {
    const { paymentIntentId } = req.params;
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      res.json(paymentIntent); // Send the payment details back to the frontend
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      res.status(500).json({ error: 'Unable to fetch payment details' });
    }
  });


  // admin portion


  app.post('/admin/login', async (req, res) => {
    const { email , password } = req.body;

    if( email!== config.ADMIN_USERNAME || password !== config.ADMIN_PASSWORD){
        return res.status(401).json({ message: 'Invalid credentials' });
    }



    const payload = { username: email, role: 'admin' };  // You can add more details if necessary
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token : token , email : email , type : 'admin' });
});


const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Bearer <token>

  if (!token) {
      return res.status(401).json({ message: 'Token missing, please provide an Authorization token.' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(403).json({ message: 'Invalid or expired token.' });
      }

      // Optionally, check if the decoded user is an admin
      if (decoded.role !== 'admin') {
          return res.status(403).json({ message: 'Not authorized as admin.' });
      }

      req.user = decoded;  // Add decoded user info to the request
      next();  // Proceed to the next middleware or route handler
  });
};


app.post('/admin/resolve-application', authenticateAdmin, async (req, res) => {

  const { application_id } = req.body;
  console.log( application_id)
  // Check if application_id is provided
  if (!application_id) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  try {
    // Update the status of the application to 'resolved' (true)
    const { data, error } = await supabase
      .from('application_table')  // Your table name
      .update({ status: true })  // Set status to true (resolved)
      .eq('application_id', application_id)
      .select(); // Where the application_id matches

    if (error) {
      throw error;
    }
    if (data.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Successfully updated
    res.status(200).json({ message: 'Application resolved successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

app.post('/admin/resolve-complaint', authenticateAdmin, async (req, res) => {
  const { complaint_id } = req.body;

  if (!complaint_id) {
    return res.status(400).json({ error: 'Complaint ID is required' });
  }

  try {
    // Update the status of the complaint to 'resolved' (true)
    const { data, error } = await supabase
      .from('complaints_table')  // Your table name
      .update({ resolved: true })  // Set resolved to true
      .eq('id', complaint_id) // Where the complaint_id matches
      .select()
    if (error) {
      throw error;
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({ message: 'Complaint resolved successfully' });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});