# backend/app/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGODB_DB")  # compat
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI not set")
DB_NAME = os.getenv("MONGODB_DB", "sabor_real")

client: AsyncIOMotorClient | None = None
db = None

async def connect():
    global client, db
    client = AsyncIOMotorClient(
        MONGODB_URI,
        uuidRepresentation="standard",
        serverSelectionTimeoutMS=20000,
        connectTimeoutMS=20000,
    )
    try:
        db = client.get_default_database()  
    except Exception:
        db = None
    if db is None:
        db = client[DB_NAME]

async def disconnect():
    if client:
        client.close()

def serialize_doc(doc: dict):
    if not doc:
        return doc
    d = dict(doc)
    if isinstance(d.get("_id"), ObjectId):
        d["_id"] = str(d["_id"])
    return d

async def serialize_many(cursor):
    return [serialize_doc(doc) async for doc in cursor]