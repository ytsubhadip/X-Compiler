
import os
from dotenv import load_dotenv

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import users_collection

load_dotenv()

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name =os.getenv("CLOUDENARY_CLOUDE_NAME"),

    api_key = os.getenv("CLOUDENARY_API_KEY"),

    api_secret = os.getenv("CLOUDENARY_API_SECRET")
)


route = APIRouter(
    tags=["Profile Image Upload"],
    prefix="/api/profile"
)

@route.post("/upload")
async def upload_profile_image(email: str=Form(...), file:UploadFile=File(...)):
    allow_items = {"image/jpg", "image/jpeg", "image/png"}

    if file.content_type not in allow_items:
        raise HTTPException(
            status_code=400,
            detail="Only jpg and png image allow"
        )

    result = cloudinary.uploader.upload(
        file.file,
        folder ="users/profile",
        resource_type="image"
    )

    image_url = result["secure_url"]
    public_id = result["public_id"]

    print("user email: ",email)
    update_result = await users_collection.update_one(
        {"email":email},
        {
            "$set": {
                "profile_image_url": image_url,
                "profile_image_public_id": public_id
            }
        }
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return{
    "message": "profile image upload successfully",
    "image_url": image_url
    }

