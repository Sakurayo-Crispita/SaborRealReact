import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "sabor_real")

client: AsyncIOMotorClient | None = None
db = None

async def connect():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
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
