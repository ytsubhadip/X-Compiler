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
// ASSESSMENT SCHEMA BLUEPRINT
// =========================================================================
const TestSchema = new mongoose.Schema({
    testcode: { type: String, required: true, uppercase: true, trim: true },
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
}, { collection: 'tests' });

const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);

// =========================================================================
// INLINE SUBMISSION MONGOOSE SCHEMA
// =========================================================================
// =========================================================================
// INLINE SUBMISSION MONGOOSE SCHEMA (UPGRADED FOR DASHBOARD)
// =========================================================================
const submissionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submissions: [
        {
            questionId: { type: String, required: true },
            submittedCode: { type: String, required: true }
        }
    ],
    score: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Graded'], default: 'Pending' },
    timeSpentMins: { type: Number, default: 0 },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema, "submissions");

// =========================================================================
// 🟢 LIVE PRODUCTION EVALUATION RECEIVER (SITS AT TOP OF THE INTERCEPT ROUTE)
// =========================================================================
// =========================================================================
// 🟢 LIVE PRODUCTION EVALUATION RECEIVER (UPDATED FOR DASHBOARD)
// =========================================================================
app.post("/api/tests/submit-evaluation", async (req, res) => {
    console.log("📥 [ROUTE HIT] Submittal endpoint reached perfectly!");
    try {
        // 1. Extract Student ID from their active Auth Token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "Missing authentication credentials." });
        }
        
        // Strip out your custom token prefix to get the raw Mongo User ID
        const token = authHeader.split(" ")[1];
        const studentId = token.replace("session-auth-token-", ""); 

        const { testId, submissions } = req.body;
        console.log("📦 [PAYLOAD RAW DATA]:", { testId, studentId, submissions });

        if (!testId || !submissions || submissions.length === 0) {
            console.log("⚠️ [VALIDATION FAILED]: Missing data metrics!");
            return res.status(400).json({ success: false, error: "Incomplete payload parameters." });
        }

        console.log("🔄 [CASTING]: Converting IDs to Mongoose ObjectIds...");
        const convertedTestId = new mongoose.Types.ObjectId(testId);
        const convertedStudentId = new mongoose.Types.ObjectId(studentId);

        console.log("💾 [DB WRITE]: Attempting Atlas insertion with Student Data...");
        const newRecord = await Submission.create({
            testId: convertedTestId,
            studentId: convertedStudentId, // Links directly to the User profile
            submissions: submissions,
            status: 'Pending',
            score: 0
        });

        console.log("✅ [DB SUCCESS]: Record saved beautifully! ID:", newRecord._id);

        return res.status(200).json({
            success: true,
            message: "Successfully logged code data to Atlas cluster!"
        });

    } catch (routeErr) {
        console.error("💥 [ROUTE CRASH LOG]:", routeErr);
        return res.status(500).json({ success: false, error: routeErr.message });
    }
});

// Route Setup Inclusions
const compileRoutes = require("./routes/compile");
app.use("/", compileRoutes);

// =========================================================================
// EXPRESS ROUTE CONTROLLERS (VIEW ENGINE INJECTIONS)
// =========================================================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages",  "index.html"));
});

app.get("/ide", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "coding-test.html"));
});

app.get("/teacher/student-records", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "student_result.html"));
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

app.get("/teacher/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "dashboard.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "user_profile", "profile.html"));
});

app.get("/teacher/test-form", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "create_test_form.html"));
});

app.get("/exam-portal", (req, res)=>{
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "coding-test.html"));
})

app.get("/teacher/test-history", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "test_history.html"));
});


app.get("/teacher/add-question", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "question_page.html"));
});

app.get("/view-test-tasks", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "view-test-tasks.html"));
});

app.get("/join-test", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "join_intercept.html"));
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
    
app.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "auth", "formate.html"));
});

app.get("/student-dash", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "dashboard.html"));
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

        return res.status(201).json({
            message: "Registration successful!",
            userId: newUser._id,
            name: newUser.name,
            role: newUser.role,
            token: "session-auth-token-" + newUser._id
        });

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
// REST ENDPOINT: ENFORCE CUSTOM ASSESSMENT CODES EXCLUSIVELY
// =========================================================================
// =========================================================================
// REST ENDPOINT: SAVE ASSESSMENTS TO MONGODB (WITH AUTO 6-DIGIT GENERATOR)
// =========================================================================
app.post("/api/tests/create", async (req, res) => {
    try {
        let { title, department, semester, duration, questions, code } = req.body;

        if (!title || !department || !semester || !duration || !questions || questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameters to construct assessment manifest."
            });
        }

        // 🟢 AUTO 6-DIGIT GENERATION VECTOR: Fallback loop if no code is provided
        let finalTestRoomCode = code || req.body.testcode || "";

        if (!finalTestRoomCode || finalTestRoomCode.trim() === "") {
            // Generates a random high-entropy 6-character alphanumeric string (e.g., 'VAHPY7')
            finalTestRoomCode = Math.random().toString(36).substring(2, 8);
        }

        // Clean formatting: enforce strict uppercase strings inside the indices layout profiles
        finalTestRoomCode = finalTestRoomCode.trim().toUpperCase();

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

        // Create the record directly inside your Atlas database tests collection
        const newTestAssessment = await Test.create({
            testcode: finalTestRoomCode,
            title: title.trim(),
            department: department,
            semester: parsedSemester,
            duration: parsedDuration,
            questions: sanitizedQuestions
        });

        console.log(`✨ New Examination Created Cleanly! Room Code: ${finalTestRoomCode}`);

        return res.status(201).json({
            success: true,
            message: "Assessment deployed live successfully!",
            testId: newTestAssessment._id,
            code: finalTestRoomCode // Returns the 6-digit code back to the client panel interface
        });

    } catch (err) {
        console.error("Test creation write crash:", err);
        return res.status(500).json({
            success: false,
            error: `Internal server failure: ${err.message || err}`
        });
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
// SERVER-SIDE: SECURE ASSESSMENT JOIN HANDSHAKE ENDPOINT
// =========================================================================
app.post("/api/tests/join", async (req, res) => {
    try {
        console.log("INBOUND HANDSHAKE BODY:", req.body);
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: "Validation token missing." });
        }

        const targetTest = await Test.findOne({ testcode: code.trim().toUpperCase() });
        console.log("🔍 DATABASE RETRIEVAL MATRIX:", targetTest);

        if (!targetTest) {
            return res.status(404).json({
                success: false,
                error: "Access Denied: Specified validation room code could not be found."
            });
        }

        return res.status(200).json({
            success: true,
            testId: targetTest._id,
            title: targetTest.title,
            department: targetTest.department,
            duration: targetTest.duration,
            questions: targetTest.questions
        });

    } catch (err) {
        console.error("Critical Room Token Verification Error:", err);
        return res.status(500).json({ success: false, error: "Internal server processing failure." });
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
// REST ENDPOINT: SECURE MUTATION PUT PIPELINE (WITH SUBMISSION GUARD CHECK)
// =========================================================================
// =========================================================================
// REST ENDPOINT: DELETE AN ASSESSMENT FROM MONGODB
// =========================================================================
app.delete("/api/tests/:id", async (req, res) => {
    try {
        const testId = req.params.id;

        // Perform the hard delete in MongoDB Atlas
        const deletedTest = await Test.findByIdAndDelete(testId);

        if (!deletedTest) {
            return res.status(404).json({ 
                success: false, 
                error: "Assessment not found in database records." 
            });
        }

        console.log(`🗑️ Test successfully deleted from DB: ${testId}`);

        return res.status(200).json({ 
            success: true, 
            message: "Assessment permanently removed from cluster records." 
        });

    } catch (err) {
        console.error("Failed to delete assessment from DB:", err);
        return res.status(500).json({ 
            success: false, 
            error: "Server error occurred while attempting to delete test." 
        });
    }
});

app.put("/api/tests/update/:id", async (req, res) => {
    try {
        const testId = req.params.id;
        let { title, department, semester, duration, code, questions } = req.body;

        const targetTest = await Test.findById(testId);
        if (!targetTest) {
            return res.status(404).json({
                success: false,
                error: "Target assessment record could not be found inside the cluster database."
            });
        }

        const cleanTitle = title ? title.trim() : targetTest.title;
        const cleanDept = department ? department : targetTest.department;
        const cleanSem = semester ? parseInt(semester, 10) : targetTest.semester;
        const cleanDuration = duration ? parseInt(duration, 10) : targetTest.duration;
        const cleanCode = code ? code.trim().toUpperCase() : targetTest.testcode;

        let sanitizedQuestions = targetTest.questions;
        if (Array.isArray(questions)) {
            sanitizedQuestions = questions.map(q => ({
                title: q.title || "Untitled Task Parameter",
                difficulty: q.difficulty || "Easy",
                tags: Array.isArray(q.tags) ? q.tags : [],
                description: q.description || "",
                examples: Array.isArray(q.examples) ? q.examples.map(ex => ({
                    input: ex.input || "",
                    output: ex.output || "",
                    explanation: ex.explanation || ""
                })) : []
            }));
        }

        const updatedTestDocument = await Test.findByIdAndUpdate(
            testId,
            {
                $set: {
                    title: cleanTitle,
                    department: cleanDept,
                    semester: cleanSem,
                    duration: cleanDuration,
                    testcode: cleanCode,
                    questions: sanitizedQuestions
                }
            },
            { new: true, runValidators: true }
        );

        console.log(`🎉 Sync Complete: Assessment Document Profile [${testId}] modified successfully!`);

        return res.status(200).json({
            success: true,
            message: "Assessment profiles modified cleanly.",
            testId: updatedTestDocument._id,
            code: updatedTestDocument.testcode
        });

    } catch (err) {
        console.error("❌ Critical Backend Update System Crash:", err);
        return res.status(500).json({
            success: false,
            error: `Internal system mutation processing engine fault block: ${err.message || err}`
        });
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