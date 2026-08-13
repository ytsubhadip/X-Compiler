async function sendEmail({ to, subject, html }) {
    try {
        const result = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: to,
            subject: subject,
            html: html
        });

        console.log("Email sent:", result);

        return result;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
}