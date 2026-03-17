"""
Match Replay Scheduler — MongoDB Connection

Uses Motor (async MongoDB driver) to connect to MongoDB Atlas.
Collections:
  - replay_jobs   → active queue (queued + running)
  - replay_history → finished jobs (completed / failed / cancelled)
"""

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://pranesh190504_db_user:4Hl76R5t9PdV0nVd@cluster0.gtmcgsk.mongodb.net/?appName=Cluster0"
DB_NAME = "replay_scheduler"

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB Atlas."""
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Create indexes for efficient querying
    await db.replay_jobs.create_index("status")
    await db.replay_jobs.create_index("priority")
    await db.replay_jobs.create_index("created_at")
    await db.replay_history.create_index("status")
    await db.replay_history.create_index("created_at")
    await db.replay_history.create_index("match_id")


async def disconnect_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()


def get_db():
    """Return the database instance."""
    return db
