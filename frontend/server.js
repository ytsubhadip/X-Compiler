const path = require('path');
const mongoose = require('mongoose');
const express = require("express");
const nodemailer = require('nodemailer'); // 🟢 ADDED: Nodemailer for Headless Admin

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
// 🟢 NODEMAILER CONFIGURATION (ADMIN APPROVAL SYSTEM)
// =========================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// =========================================================================
// MONGODB USER SCHEMA CONFIGURATION
// =========================================================================
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student' },
    
    // 🟢 ADDED: Admin Approval Fields
    teacherId: { type: String, default: null }, 
    status: { type: String, enum: ['Pending', 'Active', 'Rejected'], default: 'Active' },
    
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
// 🟢 LIVE PRODUCTION EVALUATION RECEIVER (UPDATED FOR DASHBOARD)
// =========================================================================
app.post("/api/tests/submit-evaluation", async (req, res) => {
    console.log("📥 [ROUTE HIT] Submittal endpoint reached perfectly!");
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "Missing authentication credentials." });
        }
        
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
            studentId: convertedStudentId,
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
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "pages",  "index.html")));
app.get("/ide", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "coding-test.html")));
app.get("/teacher/student-records", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "student_result.html")));
app.get("/playground", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "compiler_page", "playground.html")));
app.get("/signin", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "signin.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "signup.html")));
app.get("/password-formate", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "user_auth", "formate.html")));
app.get("/teacher/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "dashboard.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "user_profile", "profile.html")));
app.get("/teacher/test-form", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "create_test_form.html")));
app.get("/exam-portal", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "coding-test.html")));
app.get("/teacher/test-history", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "test_history.html")));
app.get("/teacher/add-question", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "question_page.html")));
app.get("/view-test-tasks", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "teacher-dash", "view-test-tasks.html")));
app.get("/join-test", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "join_intercept.html")));
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get("/forgot-password", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "auth", "formate.html")));
app.get("/student-dash", (req, res) => res.sendFile(path.join(__dirname, "public", "pages", "student-dash", "dashboard.html")));
app.get("/status", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// =========================================================================
// REST ENDPOINT: USER REGISTRATION LIFECYCLE (UPDATED FOR HEADLESS ADMIN)
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

        const isTeacher = role === 'teacher';

        const newUser = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            teacherId: null, 
            status: isTeacher ? 'Pending' : 'Active', // 🟢 Students bypass, Teachers wait
            rollnumber: rollnumber || "N/A",
            department: department || "",
            semester: semester || null
        });

        // 🟢 IF TEACHER: EMAIL THE ADMIN FOR APPROVAL
        if (isTeacher) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ADMIN_EMAIL,
                subject: `🚨 New Teacher Request: ${name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px;">
                        <h3>New X-Compiler Teacher Request</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <br>
                        <a href="${process.env.BASE_URL || 'http://localhost:8000'}/admin/verify/${newUser._id}" 
                           style="background: #2ec866; color: #111; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                           Review & Approve Application
                        </a>
                    </div>
                `
            };
            
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Admin alert email dispatched for ${email}`);
            } catch (mailErr) {
                console.error("Failed to send admin email alert:", mailErr);
            }

            return res.status(201).json({ message: "Application submitted! Awaiting Admin approval.", userId: newUser._id });
        }

        return res.status(201).json({ message: "Registration successful!", userId: newUser._id });

    } catch (err) {
        console.error("Database mutation error:", err);
        return res.status(500).json({ error: "Internal database tracking process error." });
    }
});

// =========================================================================
// REST ENDPOINT: PLATFORM CREDENTIAL AUTHORIZATION (UPDATED FOR TEACHER IDS)
// =========================================================================
app.post("/signin", async (req, res) => {
    try {
        const { email, password, role, teacherId } = req.body; // teacherId sent from frontend

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const userProfile = await User.findOne({ email: email.toLowerCase(), role: role });
        if (!userProfile || userProfile.password !== password) {
            return res.status(401).json({ error: "Invalid credentials or account role mismatch." });
        }

        // 🟢 BLOCK PENDING ACCOUNTS
        if (userProfile.status === 'Pending') {
            return res.status(401).json({ error: "Your account is awaiting Admin approval. Check your email." });
        }

        // 🟢 STRICT TEACHER ID VERIFICATION
        if (role === 'teacher') {
            if (!teacherId) {
                return res.status(401).json({ error: "Teacher Unique ID is required to login." });
            }
            if (userProfile.teacherId !== teacherId.trim()) {
                return res.status(401).json({ error: "Invalid Teacher Unique ID." });
            }
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
// REST ENDPOINT: SAVE ASSESSMENTS TO MONGODB 
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

        let finalTestRoomCode = code || req.body.testcode || "";

        if (!finalTestRoomCode || finalTestRoomCode.trim() === "") {
            finalTestRoomCode = Math.random().toString(36).substring(2, 8);
        }

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
            code: finalTestRoomCode 
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
        console.error("Test history fetch failure:", err);
        return res.status(500).json({ error: "Internal service data collection constraint block." });
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
            return res.status(404).json({ error: "Requested assessment manifest record not found." });
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
        console.error("Single test details failure:", err);
        return res.status(500).json({ error: "Internal database query constraint failure." });
    }
});

// =========================================================================
// SERVER-SIDE: SECURE ASSESSMENT JOIN HANDSHAKE ENDPOINT
// =========================================================================
app.post("/api/tests/join", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: "Validation token missing." });
        }

        const targetTest = await Test.findOne({ testcode: code.trim().toUpperCase() });

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
        console.error("Room Token Verification Error:", err);
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
// REST ENDPOINT: DELETE AN ASSESSMENT FROM MONGODB
// =========================================================================
app.delete("/api/tests/:id", async (req, res) => {
    try {
        const testId = req.params.id;
        const deletedTest = await Test.findByIdAndDelete(testId);

        if (!deletedTest) {
            return res.status(404).json({ success: false, error: "Assessment not found in database records." });
        }

        console.log(`🗑️ Test successfully deleted from DB: ${testId}`);
        return res.status(200).json({ success: true, message: "Assessment permanently removed from cluster records." });

    } catch (err) {
        console.error("Failed to delete assessment:", err);
        return res.status(500).json({ success: false, error: "Server error occurred while attempting to delete test." });
    }
});

app.put("/api/tests/update/:id", async (req, res) => {
    try {
        const testId = req.params.id;
        let { title, department, semester, duration, code, questions } = req.body;

        const targetTest = await Test.findById(testId);
        if (!targetTest) {
            return res.status(404).json({ success: false, error: "Target assessment record could not be found." });
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

        return res.status(200).json({
            success: true,
            message: "Assessment profiles modified cleanly.",
            testId: updatedTestDocument._id,
            code: updatedTestDocument.testcode
        });

    } catch (err) {
        console.error("❌ Critical Backend Update System Crash:", err);
        return res.status(500).json({ success: false, error: `Internal fault block: ${err.message || err}` });
    }
});

// =========================================================================
// 🟢 HEADLESS ADMIN ROUTES: EMAIL-BASED TEACHER APPROVAL
// =========================================================================

// 1. Bot-Proof Confirmation UI for the Admin
app.get("/admin/verify/:id", async (req, res) => {
    try {
        const targetId = req.params.id;
        const teacher = await User.findById(targetId);

        if (!teacher || teacher.status === 'Active') {
            return res.send("<h1 style='color: white; font-family: sans-serif; text-align: center; padding-top: 50px; background: #0a0c10;'>Error: Teacher not found or already approved.</h1>");
        }

        res.send(`
            <body style="background: #0a0c10; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding-top: 100px;">
                <div style="background: #161b22; max-width: 400px; margin: 0 auto; padding: 40px; border-radius: 12px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h2 style="margin-top: 0;">Approve Teacher Access</h2>
                    <p style="color: #8b949e; margin-bottom: 5px;">Name: <strong style="color: #fff;">${teacher.name}</strong></p>
                    <p style="color: #8b949e; margin-bottom: 30px;">Email: <strong style="color: #fff;">${teacher.email}</strong></p>
                    
                    <form action="/api/admin/approve-teacher/${teacher._id}" method="POST">
                        <button type="submit" style="background: #2ec866; color: #0d1117; padding: 14px 24px; font-size: 1rem; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; width: 100%; transition: 0.2s;">
                            Generate Code & Approve
                        </button>
                    </form>
                </div>
            </body>
        `);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// 2. The Final Approval Engine (Mutates DB and Emails Teacher)
app.post("/api/admin/approve-teacher/:id", async (req, res) => {
    try {
        const targetId = req.params.id;
        
        // Generate the strict TCH- ID
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const generatedTeacherId = "TCH-" + randomNum;

        // Update MongoDB Profile
        const updatedTeacher = await User.findByIdAndUpdate(targetId, {
            status: 'Active',
            teacherId: generatedTeacherId
        }, { new: true });

        if (!updatedTeacher) {
            return res.status(404).send("Target teacher profile lost during transaction.");
        }

        // Email the Teacher their credentials
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: updatedTeacher.email,
            subject: `✅ Welcome to X-Compiler! Your Teacher Account is Approved`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>Welcome to the X-Compiler Platform, ${updatedTeacher.name}!</h2>
                    <p>The Administrator has reviewed and verified your account request.</p>
                    <div style="background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2ec866;">
                        <p style="margin: 0; color: #555; font-size: 0.9rem; text-transform: uppercase; font-weight: bold;">Your Teacher Unique ID</p>
                        <p style="margin: 5px 0 0 0; font-size: 1.8rem; color: #000; font-weight: 900; letter-spacing: 1px;">${generatedTeacherId}</p>
                    </div>
                    <p>You can now log in to the dashboard using your Email, Password, and this Unique ID.</p>
                </div>
            `
        };
        
        try {
            await transporter.sendMail(mailOptions);
        } catch (mailErr) {
            console.error("Failed to send approval email to teacher:", mailErr);
        }
        
        res.send(`
            <body style="background: #0a0c10; color: #fff; font-family: 'Segoe UI', sans-serif; text-align: center; padding-top: 100px;">
                <div style="background: #161b22; max-width: 450px; margin: 0 auto; padding: 40px; border-radius: 12px; border: 1px solid #30363d;">
                    <h1 style='color: #2ec866; font-size: 3rem; margin: 0 0 10px 0;'>✓</h1>
                    <h2 style="margin-top: 0;">Teacher Approved</h2>
                    <p style="color: #8b949e;">ID <strong>${generatedTeacherId}</strong> generated securely.</p>
                    <p style="color: #8b949e;">Credentials dispatched to ${updatedTeacher.email}.</p>
                </div>
            </body>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to approve teacher pipeline.");
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