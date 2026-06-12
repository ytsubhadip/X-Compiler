const express = require("express");
const router = express.Router();

const { performance } = require("perf_hooks");

const languageMap = {
    "c": 50,
    "cpp": 54,
    "c++": 54, 
    "java": 62,
    "javascript": 63,
    "python": 71,
};

// Helper function to safely decode Base64 strings from Judge0
function safeDecode(encodedStr) {
    if (!encodedStr) return "";
    try {
        return Buffer.from(encodedStr, 'base64').toString('utf-8');
    } catch (e) {
        return encodedStr; 
    }
}


async function executeCode(code, lang, input = "") {
    const language_id = languageMap[lang.toLowerCase().trim()];

    if (!language_id) {
        throw new Error(`Unsupported language selection: ${lang}`);
    }

  
    const response = await fetch(
        "https://ce.judge0.com/submissions?wait=true&base64_encoded=true",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                source_code: Buffer.from(code).toString('base64'), 
                language_id: language_id,
                stdin: input ? Buffer.from(input).toString('base64') : "" 
            })
        }
    );

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Judge0 API returned status ${response.status}: ${errorDetails}`);
    }

    return await response.json();
}

// Router endpoint
router.post("/compiler", async (req, res) => {
    try {
        const { code, lang, input } = req.body;

        if (!code) {
            return res.json({ error: "Code body cannot be empty.", output: null });
        }

        const result = await executeCode(code, lang, input);
       

        
        const isError = result.status && result.status.id !== 3;

        if (isError) {
           
            let rawError = result.compile_output || result.stderr || result.status?.description || "Execution Failed";
            let decodedError = safeDecode(rawError);

            return res.json({
                error: decodedError,
                output: null,
                status: result.status?.description,
                time: result.time ? parseFloat(result.time) * 1000 : 0,
                memory: result.memory || 0
            });
        }

     
        return res.json({
            output: safeDecode(result.stdout) || "Execution completed with no output output.",
            error: null,
            status: result.status?.description,
            time: result.time ? parseFloat(result.time) * 1000 : 0,
            memory: result.memory || 0
        });

    } catch (err) {
        console.error("Backend Router Catch:", err.message);
        return res.json({
            error: `Server Configuration Error: ${err.message}`,
            output: null
        });
    }
});

module.exports = router;