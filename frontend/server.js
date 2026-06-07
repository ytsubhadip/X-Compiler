const path = require('path');
const mongoose = require('mongoose');
const express = require("express");

require('dotenv').config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.static(path.join(__dirname, "public")));

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, 
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    roleIdentifier: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const compileRoutes = require("./routes/compile");
app.use("/", compileRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "signin.html"));
});

app.get("/ide", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "compiler_page", "testCompiler.html"));
});

app.get("/playground", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "compiler_page", "playground.html"));
});

app.get("/signin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "signin.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "signup.html"));
});

app.get("/password-formate",(req, res)=>{
      res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "formate.html"));
})

app.get("/create-test", (req, res)=>{
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "create_test_langing_page.html"))
})
app.get("/profile", (req, res)=>{
    res.sendFile(path.join(__dirname, "public","pages","user_profile", "profile.html" ))
})

app.get("/test-form",(req, res)=>{
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "create_test_form.html"))
})
app.get("/test-history",(req, res)=>{
    res.sendFile(path.join(__dirname, "public", "pages","create_test", "test_history.html"))
})
app.get("/dashbord",(req, res)=>{
    res.sendFile(path.join(__dirname, "public", "pages","student-dash", "student-dash.html"))
})
app.get("/add-question", (req, res)=>{
    res.sendFile(path.join(__dirname,"public", "pages", "create_test", "question_page.html"))
})
app.get("/status", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role, roleIdentifier } = req.body;

        if (!name || !email || !password || !roleIdentifier) {
            return res.status(400).json({ error: "Missing mandatory registration fields." });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (targetUser) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role,
            roleIdentifier
        });

        return res.status(201).json({ message: "Registration successful!", userId: newUser._id });

    } catch (err) {
        console.error("Database mutation error:", err);
        return res.status(500).json({ error: "Internal processing constraint error." });
    }
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userProfile = await User.findOne({ email: email.toLowerCase(), role: role });
        if (!userProfile || userProfile.password !== password) {
            return res.status(401).json({ error: "Invalid credentials or role mismatch." });
        }

        return res.status(200).json({
            message: "Authentication successful.",
            name: userProfile.name,     
            role: userProfile.role,      
            token: "session-auth-token-" + userProfile._id
        });

    } catch (err) {
        console.error("Authentication query error:", err);
        return res.status(500).json({ error: "Internal server gate malfunction." });
    }
});

const PORT = process.env.PORT || 8000;
const dbURI = process.env.MONGODB_URI;

async function launchBackendEngine() {
    if (!dbURI) {
        console.error("CRITICAL: MONGODB_URI missing from environment context.");
        process.exit(1);
    }

    try {
        console.log("Attempting MongoDB Atlas handshake...");
        await mongoose.connect(dbURI);
        console.log(" Database connected cleanly to Atlas cluster!");
        
        app.listen(PORT, () => {
            console.log(`Server running live on port http://localhost:${PORT}`);
        });
    } catch (crash) {
        console.error("DATABASE CONNECTION FAILED:", crash.message || crash);
        process.exit(1);
    }
}

launchBackendEngine();