import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import config from "./config.js";
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient( config.BASE_URL,  config.BASE_KEY ) 

const app = express();
const port = 5173;

const saltRounds = 10;
// const myPlaintextPassword = 'om_anand';
// const someOtherPlaintextPassword = 'not_bacon';

// bcrypt.genSalt(saltRounds, function(err, salt) {
//     bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
//         // Store hash in your password DB.
//         console.log(hash)
//     });
// });
// //bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
    // result == true
//});


// CORS handling
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};

app.use(cors(corsOptions));

// parsing the string to json using middleware

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

//LOGIN ROUTES

app.post("/student/authenticate", async (req, res) => {
   
    const { email , password } = req.body
    // checking if user already exists 

    try {
        const { data, error, status } = await supabase
            .from('user_auth')
            .select('*') 
            .eq('email', email) 
            .single(); 
        
        if (error && status !== 406) {
            console.error('Error querying user by email:', error);
            return res.status(500).json({ message: "Error fetching user details", user : null , error: error });
        }
        
        if (!data) {
            console.log('User not found');
            return res.status(404).json({ message: "User not found" , user : null });
        }

        const pass_status = await bcrypt.compare(password, data.password)
        // If user is found, return the user data
        return res.status(200).json({
            message: "User found",
            user: data,
            valid_creds : pass_status
        });

    } catch (err) {
        console.error('Unexpected Error:', err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
    

});

app.post("/admin/authenticate", async (req, res) => {
    const { email , password } = req.body

    try {
        const { data, error, status } = await supabase
            .from('user_auth')
            .select('*') 
            .eq('email', email) 
            .single(); 
        
        if (error && status !== 406) {
            console.error('Error querying user by email:', error);
            return res.status(500).json({ message: "Error fetching user details", user : null , error: error });
        }
        
        if (!data) {
            console.log('User not found');
            return res.status(404).json({ message: "User not found" , user : null });
        }

        const pass_status = await bcrypt.compare(password, data.password)
        // If user is found, return the user data
        return res.status(200).json({
            message: "User found",
            user: data,
            valid_creds : pass_status
        });

    } catch (err) {
        console.error('Unexpected Error:', err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
    
});


app.post("/hr/authenticate", (req, res) => {
    const email = req.email
    const password = req.password
});

app.post("/guest/authenticate", (req, res) => {
    const email = req.email
    const password = req.password
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
})


// SIGNUP ROUTES

app.post("/student/create_account", async (req, res) => {
    const { email , password , role } = req.body
    const encrypted_password = await bcrypt.hash(password, saltRounds);
    const { data, error } = await supabase
    .from('user_auth')
    .insert([
      { email: email , password: encrypted_password , role : 'student' },
    ])
    .select()
  
    if( error ){
      return res.status(500).json({
          message: "Server error",
          error: err.message || err
      });
    }
    else{
      return res.status(201).json({
          message: "User created successfully",
          user: data[0]  
      });    
    }
})

app.post("/admin/create_account", async (req, res) => {
    const { email , password , role } = req.body
    const encrypted_password = await bcrypt.hash(password, saltRounds);
    const { data, error } = await supabase
    .from('user_auth')
    .insert([
      { email: email , password: encrypted_password , role : 'admin' },
    ])
    .select()

    if( error ){
      return res.status(500).json({
          message: "Server error",
          error: err.message || err
      });
    }
    else{
      return res.status(201).json({
          message: "User created successfully",
          user: data[0]  
      });    
    }
});     

app.post("/hr/create_account", async (req, res) => {
    const { email , password , role } = req.body  
    const encrypted_password = await bcrypt.hash(password, saltRounds);
    const { data , error } = await supabase
    .from('user_auth')
    .insert([
      { email: email , password: encrypted_password , role : 'hr' },
    ])
    .select()

    if( error ){
      return res.status(500).json({
          message: "Server error",
          error: err.message || err
      });
    }
    else{
      return res.status(201).json({
          message: "User created successfully",
          user: data[0]  
      });    
    }

});

app.post("/guest/create_account", async (req, res) => {
    const { email , password , role } = req.body
    const encrypted_password = await bcrypt.hash(password, saltRounds);
    const { data , error } = await supabase
    .from('user_auth')
    .insert([
      { email: email , password: encrypted_password , role : 'guest' },
    ])
    .select()

    if( error ){
      return res.status(500).json({
          message: "Server error",
          error: err.message || err
      });
    }
    else{
      return res.status(201).json({
          message: "User created successfully",
          user: data[0]  
      });    
    }
})