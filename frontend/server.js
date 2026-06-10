const path = require('path');
const mongoose = require('mongoose');
const express = require("express");

require('dotenv').config();

const app = express();
app.use(express.json());

// Cross-Origin Resource Sharing (CORS) Configuration headers
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

// =========================================================================
// MONGODB USER SCHEMA CONFIGURATION
// =========================================================================
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }, 
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    rollnumber: { type: String, default: "N/A" },
    department: { type: String, default: "" },
    semester: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// =========================================================================
// 🟢 FIXED: INCLUDED 'testcode' INSIDE ASSESSMENT SCHEMA BLUEPRINT
// =========================================================================
const TestSchema = new mongoose.Schema({
    testcode: { type: String, required: true, uppercase: true, trim: true }, // 🟢 FIX: Added missing database string target key definition
    title: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    duration: { type: Number, required: true },
    questions: [
        {
            title: { type: String, required: true },
            difficulty: { type: String, required: true },
            tags: [String],
            description: { type: String, required: true },
            examples: [
                {
                    input: String,
                    output: String,
                    explanation: String
                }
            ]
        }
    ],
    createdAt: { type: Date, default: Date.now }
}, { collection: 'tests' }); // Force explicit pluralized collection matching rules

const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);

// Route Setup Inclusions
const compileRoutes = require("./routes/compile");
app.use("/", compileRoutes);

// =========================================================================
// EXPRESS ROUTE CONTROLLERS (VIEW ENGINE INJECTIONS)
// =========================================================================
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

app.get("/password-formate", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "formate.html"));
});

app.get("/create-test", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "create_test_langing_page.html"));
});

app.get("/profile", (req, res) => {
    // Profile page lives under public/user_profile (not public/pages/user_profile)
    res.sendFile(path.join(__dirname, "public", "user_profile", "profile.html"));
});

app.get("/test-form", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "create_test_form.html"));
});

app.get("/test-history", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "test_history.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "student-dash.html"));
});

app.get("/add-question", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "question_page.html"));
});

app.get("/view-test-tasks", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "create_test", "view-test-tasks.html"));
});

app.get("/join-test", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "join_intercept.html"));
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "auth", "formate.html"));
});

app.get("/coding-test", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "compiler_page", "coding-test.html"));
});

app.get("/status", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// =========================================================================
// REST ENDPOINT: USER REGISTRATION LIFECYCLE
// =========================================================================
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role, rollnumber, department, semester } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Missing mandatory fields (name, email, password)." });
        }

        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (targetUser) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            rollnumber: rollnumber || "N/A",
            department: department || "",
            semester: semester || null
        });

        return res.status(201).json({ message: "Registration successful!", userId: newUser._id });

    } catch (err) {
        console.error("Database mutation error:", err);
        return res.status(500).json({ error: "Internal database tracking process error." });
    }
});

// =========================================================================
// REST ENDPOINT: PLATFORM CREDENTIAL AUTHORIZATION
// =========================================================================
app.post("/signin", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userProfile = await User.findOne({ email: email.toLowerCase(), role: role });
        if (!userProfile || userProfile.password !== password) {
            return res.status(401).json({ error: "Invalid credentials or account role mismatch." });
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

// =========================================================================
// REST ENDPOINT: GET CURRENT AUTHENTICATED USER INFORMATION
// =========================================================================
app.get("/api/auth/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing authentication credentials." });
        }

        const token = authHeader.split(" ")[1];
        const userId = token.replace("session-auth-token-", "");

        const userProfileInstance = await User.findById(userId);
        if (!userProfileInstance) {
            return res.status(404).json({ error: "User session details not found." });
        }

        return res.status(200).json({
            name: userProfileInstance.name,
            email: userProfileInstance.email,
            role: userProfileInstance.role,
            rollnumber: userProfileInstance.rollnumber || "N/A",
            department: userProfileInstance.department || "",
            semester: userProfileInstance.semester || null
        });

    } catch (err) {
        console.error("Fetch profile credentials error:", err);
        return res.status(500).json({ error: "Internal server database retrieval gate failure." });
    }
});

// =========================================================================
// REST ENDPOINT: SAVE COMPILED TESTS ASSESSMENTS TO MONGODB
// =========================================================================
app.post("/api/tests/create", async (req, res) => {
    try {
        // 🟢 INCLUDED 'code' IN THE INBOUND DESERIALIZER DESTRUCTURING STREAM
        let { title, department, semester, duration, questions, code } = req.body;

        if (!title || !department || !semester || !duration || !questions || questions.length === 0) {
            return res.status(400).json({ error: "Missing required parameters to construct assessment manifest." });
        }

        // Auto fallback generation string key block logic loop in case teacher panel doesn't pass one
        const finalTestRoomCode = (code || req.body.testcode || Math.random().toString(36).substring(2, 8)).trim().toUpperCase();

        const parsedSemester = parseInt(semester, 10);
        const parsedDuration = parseInt(duration, 10);

        const sanitizedQuestions = questions.map(q => ({
            title: q.title || "Untitled Question",
            difficulty: q.difficulty || "Easy",
            tags: Array.isArray(q.tags) ? q.tags : [],
            description: q.description || "",
            examples: Array.isArray(q.examples) ? q.examples.map(ex => ({
                input: ex.input || "",
                output: ex.output || "",
                explanation: ex.explanation || ""
            })) : []
        }));

        const newTestAssessment = await Test.create({
            testcode: finalTestRoomCode, // 🟢 FIXED: Successfully saved straight down to your collections
            title: title.trim(),
            department: department,
            semester: parsedSemester,
            duration: parsedDuration,
            questions: sanitizedQuestions
        });

        return res.status(201).json({ 
            message: "Assessment deployed live successfully!", 
            testId: newTestAssessment._id,
            code: finalTestRoomCode
        });

    } catch (err) {
        console.error("Test creation database write error:", err);
        return res.status(500).json({ error: `Internal server processing failure: ${err.message || err}` });
    }
});

// =========================================================================
// REST ENDPOINT: RETRIEVE COMPILED TESTS HISTORIC MANIFESTS LOGS
// =========================================================================
app.get("/api/tests/history", async (req, res) => {
    try {
        const deployedTestLogHistory = await Test.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            count: deployedTestLogHistory.length,
            tests: deployedTestLogHistory
        });
    } catch (err) {
        console.error("Test history cluster fetch execution breakdown failure:", err);
        return res.status(500).json({ error: "Internal service data collection engine query constraint block." });
    }
});

// =========================================================================
// REST ENDPOINT: RETRIEVE SINGLE TEST DETAILS
// =========================================================================
app.get("/api/tests/details/:id", async (req, res) => {
    try {
        const testId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: "Malformed structural testing reference token identifier." });
        }

        const testDetails = await Test.findById(testId);
        if (!testDetails) {
            return res.status(404).json({ error: "Requested assessment manifest record not found in system index." });
        }

        let submissionCount = 0;
        if (mongoose.models.Submission) {
            submissionCount = await mongoose.models.Submission.countDocuments({ testId: testId });
        }

        return res.status(200).json({
            status: "success",
            hasSubmissions: submissionCount > 0,
            totalSubmissions: submissionCount,
            test: testDetails
        });

    } catch (err) {
        console.error("Single test details collection fetch trace malfunction:", err);
        return res.status(500).json({ error: "Internal database query runtime evaluation constraint failure." });
    }
});

// =========================================================================
// REST ENDPOINT: SECURE MUTATION PUT PIPELINE (WITH SUBMISSION GUARD CHECK)
// =========================================================================
app.put("/api/tests/update/:id", async (req, res) => {
    try {
        const testId = req.params.id;
        let { title, department, semester, duration, questions } = req.body;

        if (!mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ error: "Malformed transaction payload target ID reference token." });
        }

        let liveSubmissionCount = 0;
        if (mongoose.models.Submission) {
            liveSubmissionCount = await mongoose.models.Submission.countDocuments({ testId: testId });
        }
        
        if (liveSubmissionCount > 0) {
            return res.status(423).json({ 
                error: "🔒 Mutation Rejected: A student has just initiated this exam. Edits are now permanently locked to protect grading integrity!" 
            });
        }

        const parsedSemester = parseInt(semester, 10);
        const parsedDuration = parseInt(duration, 10);

        const updatedTest = await Test.findByIdAndUpdate(
            testId,
            {
                title: title.trim(),
                department: department,
                semester: parsedSemester,
                duration: parsedDuration,
                questions: questions
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({ 
            message: "Assessment specifications and questions modified cleanly!", 
            test: updatedTest 
        });

    } catch (err) {
        console.error("Protected test update trace crashed:", err);
        return res.status(500).json({ error: "Internal system mutation processing engine fault block." });
    }
});

// =========================================================================
// 🟢 UPGRADED MULTI-MATCH HANDSHAKE ROUTE (Checks testcode OR hex _id)
// =========================================================================
app.post("/api/tests/join", async (req, res) => {
    try {
        const { code } = req.body; 

        if (!code) {
            return res.status(200).json({ success: false, error: "Missing verification token signature." });
        }

        const cleanToken = code.trim();
        const upperToken = cleanToken.toUpperCase();

        // Check if the input string is a structurally valid 24-character MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(cleanToken);

        // 🧠 MULTI-MATCH FILTER: Match either the unique testcode OR the native hex _id string
        const activeTestMatch = await Test.findOne({
            $or: [
                { testcode: upperToken },
                ...(isValidObjectId ? [{ _id: cleanToken }] : [])
            ]
        });

        console.log("🔍 Advanced Multi-Search Result:", activeTestMatch ? "MATCH FOUND! 🎉" : "NULL (NOT FOUND)");

        if (!activeTestMatch) {
            return res.status(200).json({ 
                success: false, 
                error: "Invalid test code or assessment ID. Please check with your evaluator." 
            });
        }

        return res.status(200).json({
            success: true,
            testId: activeTestMatch._id,
            duration: activeTestMatch.duration || 60
        });

    } catch (err) {
        console.error("Join pipeline error:", err);
        return res.status(500).json({ success: false, error: "Internal transaction failure." });
    }
});

// =========================================================================
// 🟢 FIXED: ENFORCE CUSTOM ASSESSMENT CODES EXCLUSIVELY
// =========================================================================
app.post("/api/tests/create", async (req, res) => {
    try {
        let { title, department, semester, duration, questions, code } = req.body;

        // Fallback check if the key was sent as req.body.testcode instead
       const finalTestRoomCode = (code || req.body.testcode || "").trim().toUpperCase();

        // ❌ CRITICAL CHANGE: If no code is provided, throw a clear error instead of generating a random one
        if (!finalTestRoomCode || finalTestRoomCode.trim() === "") {
            return res.status(400).json({ 
                success: false, 
                error: "A custom test access code (e.g., 'OLD-7878') is strictly required." 
            });
        }

        // Structural length guard validation to ensure it matches your custom formatting
        if (finalTestRoomCode.length < 5) {
            return res.status(400).json({ 
                success: false, 
                error: "The custom code format is invalid. Please use a structured format like 'OLD-7878'." 
            });
        }

        const parsedSemester = parseInt(semester, 10);
        const parsedDuration = parseInt(duration, 10);

        const sanitizedQuestions = questions.map(q => ({
            title: q.title || "Untitled Question",
            difficulty: q.difficulty || "Easy",
            tags: Array.isArray(q.tags) ? q.tags : [],
            description: q.description || "",
            examples: Array.isArray(q.examples) ? q.examples.map(ex => ({
                input: ex.input || "",
                output: ex.output || "",
                explanation: ex.explanation || ""
            })) : []
        }));

        const newTestAssessment = await Test.create({
            testcode: finalTestRoomCode, // 🟢 Saves your exact typed code
            title: title.trim(),
            department: department,
            semester: parsedSemester,
            duration: parsedDuration,
            questions: sanitizedQuestions
        });

        return res.status(201).json({ 
            success: true,
            message: "Assessment deployed live successfully!", 
            testId: newTestAssessment._id,
            code: finalTestRoomCode
        });

    } catch (err) {
        console.error("Test creation write crash:", err);
        return res.status(500).json({ error: `Internal server failure: ${err.message || err}` });
    }
});

// =========================================================================
// REST ENDPOINT: FORGOT PASSWORD RESET HANDSHAKE
// =========================================================================
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { email, rollNumber, password } = req.body;

        if (!email || !rollNumber || !password) {
            return res.status(200).json({ success: false, error: "All validation fields are strictly required." });
        }

        const userInstance = await User.findOne({ 
            email: email.trim().toLowerCase(),
            rollnumber: rollNumber.trim() 
        });

        if (!userInstance) {
            return res.status(200).json({ 
                success: false, 
                error: "Authentication Failed: Provided credentials do not match our academic database records." 
            });
        }

        userInstance.password = password; 
        await userInstance.save();

        return res.status(200).json({ 
            success: true, 
            message: "Password updated successfully! Redirecting..." 
        });

    } catch (err) {
        console.error("Password reset failure:", err);
        return res.status(500).json({ success: false, error: "Internal transaction failure." });
    }
});

// =========================================================================
// SERVICE INIT CONTEXT
// =========================================================================
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
        console.log("Database connected cleanly to Atlas cluster!");
        
        app.listen(PORT, () => {
            console.log(`Server running live on port http://localhost:${PORT}`);
        });
    } catch (crash) {
        console.error("DATABASE CONNECTION FAILED:", crash.message || crash);
        process.exit(1);
    }
}

launchBackendEngine();