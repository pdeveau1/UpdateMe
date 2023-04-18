from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson.objectid import ObjectId
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Define CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["UpdateMe"]
users = db["users"]

# Define Pydantic models
class Notification(BaseModel):
    type: str
    time: str
    data: dict

class User(BaseModel):
    id: str
    username: str
    password: str
    notifications: List[Notification]

# Define API endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to UpdateMe!"}

@app.post("/users")
async def create_user(user: User):
    # Insert new user into MongoDB
    user_dict = user.dict()
    user_dict.pop("id")
    result = users.insert_one(user_dict)
    # Return the new user's ID
    return {"id": str(result.inserted_id)}

@app.get("/users/{user_id}")
async def read_user(user_id: str):
    # Retrieve user from MongoDB
    user = users.find_one({"_id": ObjectId(user_id)})
    if user:
        user.pop("_id")
        return user
    else:
        return {"message": "User not found"}

@app.put("/users/{user_id}")
async def update_user(user_id: str, user: User):
    # Update user in MongoDB
    user_dict = user.dict()
    user_dict.pop("id")
    result = users.replace_one({"_id": ObjectId(user_id)}, user_dict)
    if result.modified_count:
        return {"message": "User updated successfully"}
    else:
        return {"message": "User not found"}

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    # Delete user from MongoDB
    result = users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count:
        return {"message": "User deleted successfully"}
    else:
        return {"message": "User not found"}

# Run the API server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

