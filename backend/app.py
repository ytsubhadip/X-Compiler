import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import resend

load_dotenv()

app = FastAPI()

resend.api_key = os.getenv("RESEND_API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]

)


@app.get("/")
async def root():

    return {
            "message":"welcome X compiler API",
            "status": "Active"
            }

@app.get("/send")
def test_email():
    result = resend.Emails.send(
        {
            "from":"onboarding@resend.dev",
            "to":"ytsubhadip0099@gmail.com",
            "subject":"Test email api",
            "html": """
                    
                    <h2 style="margin-top: 0;">Approve Teacher Access</h2>
                    <p style="color: #8b949e; margin-bottom: 5px;">Name: <strong style="color: #fff;">${teacher.name}</strong></p>
                    <p style="color: #8b949e; margin-bottom: 30px;">Email: <strong style="color: #fff;">${teacher.email}</strong></p>
                   
                    """
        }
    )




    return {
        "success": True,
        "message":"Email send successfully"
    }
    
@app.get("/status")
def status_backend():
    return {
        "status":"ok",
        "uptime": time.process_time()
    }


