import os
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv

load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGO_URI"))

database = client["ml-compiler"]

users_collection = database["users"]