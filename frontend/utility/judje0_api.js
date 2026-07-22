async function executeCode(code, lang, input = "") {
    const language_id = languageMap[lang.toLowerCase()];

    const response = await fetch(
        "https://ce.judge0.com/submissions?wait=true",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                source_code: code,
                language_id,
                stdin: input
            })
        }
    );

    return await response.json();
}