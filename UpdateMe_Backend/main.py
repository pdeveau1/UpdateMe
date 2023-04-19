from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from passlib.hash import bcrypt
import jwt
import datetime
import pymongo
from typing import Dict
import httpx
import asyncio
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class User(BaseModel):
    id: str
    email: str
    password: str
    first_name: str
    last_name: str
    phone_number: str


class WeatherPreferences(BaseModel):
    notify: bool
    location_zipcode: str


class StocksPreferences(BaseModel):
    notify: bool
    stock_symbols: List[str]


class NewsPreferences(BaseModel):
    notify: bool
    category: str


class NotificationPreferences(BaseModel):
    weather: Optional[WeatherPreferences]
    stocks: Optional[StocksPreferences]
    news: Optional[NewsPreferences]
    time_of_day: str


class Notification(BaseModel):
    user_id: str
    notification_type: str
    content: str
    scheduled_time: datetime.datetime
    status: str

class UserWithNotificationPreferences(User):
    notification_preferences: Optional[NotificationPreferences] = None

client = pymongo.MongoClient("mongodb+srv://abhinoorbu:rkgy2pemFiKx3UWr@cluster0.o0mejie.mongodb.net/?retryWrites=true&w=majority")
db = client["UpdateMe"]
users_collection = db["users"]

app = FastAPI()

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

API_KEY_WEATHER = "f6dd306c6f52a0080725d1bc7272222c"
async def get_weather(zip_code: str):
    url = f"http://api.openweathermap.org/data/2.5/weather?zip={zip_code}&appid={API_KEY_WEATHER}&units=imperial"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ValueError("Failed to fetch weather data")

    data = response.json()
    current_temp = data["main"]["temp"]
    day_high = data["main"]["temp_max"]
    day_low = data["main"]["temp_min"]

    return {
        "current_temp": current_temp,
        "day_high": day_high,
        "day_low": day_low,
    }

API_KEY_STOCKS = "U4LE3AUN0DEJUK1E"
async def get_stock_price(symbol: str):
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={API_KEY_STOCKS}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ValueError("Failed to fetch stock data")

    data = response.json()
    stock_price = float(data["Global Quote"]["05. price"])

    return {"symbol": symbol, "price": stock_price}

API_KEY_NEWS = "493d7f062fb046679a635ec147fca951 "
async def get_top_news(category: str):
    url = f"https://newsapi.org/v2/top-headlines?category={category}&apiKey={API_KEY_NEWS}&pageSize=3&language=en"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ValueError("Failed to fetch news data")

    data = response.json()
    articles = data["articles"]

    top_news = [
        {
            "title": article["title"],
            "url": article["url"],
            "source": article["source"]["name"],
        }
        for article in articles
    ]

    return top_news

SENDGRID_API_KEY = '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'
async def send_notification(user: UserWithNotificationPreferences):
    content = ""

    preferences = user.notification_preferences

    if preferences.weather and preferences.weather.notify:
        weather_data = await get_weather(preferences.weather.location_zipcode)
        content += f"<h3>Weather:</h3><p>Current temp {weather_data['current_temp']}°F, High {weather_data['day_high']}°F, Low {weather_data['day_low']}°F</p>"

    if preferences.stocks and preferences.stocks.notify:
        stock_symbols = preferences.stocks.stock_symbols
        stock_prices = await asyncio.gather(*(get_stock_price(symbol) for symbol in stock_symbols))
        stock_message = ", ".join([f"{sp['symbol']} ${sp['price']}" for sp in stock_prices])
        content += f"<h3>Stocks:</h3><p>{stock_message}</p>"

    if preferences.news and preferences.news.notify:
        top_news = await get_top_news(preferences.news.category)
        news_message = "<br>".join([f"{n['title']} - {n['source']} <a href='{n['url']}'>Read more</a>" for n in top_news])
        content += f"<h3>Top News:</h3><p>{news_message}</p>"

    message = Mail(
        from_email='abhinoor@bu.edu',
        to_emails=user.email,
        subject='Your UpdateMe Notification')
    
    message.template_id = "d-c5f3c3dfe2d34888a81d9468945d2a13"
    
    message.dynamic_template_data = {
        'user': {
            'first_name': user.first_name
        },
        'content': content
    }

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = await sg.send(message)
        print(f"Email sent to {user.email}, status: {response.status_code}")
    except Exception as e:
        print(f"Error sending email to {user.email}: {e}")


async def send_notifications_to_users():
    users = users_collection.find({})

    for user_data in users:
        user = UserWithNotificationPreferences.parse_obj(user_data)
        await send_notification(user)


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserWithNotificationPreferences):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    hashed_password = bcrypt.hash(user.password)
    user.password = hashed_password

    result = users_collection.insert_one(user.dict())

    return {"user_id": str(result.inserted_id)}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_model = UserWithNotificationPreferences.parse_obj(user)

    if not bcrypt.verify(form_data.password, user_model.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user_model.email}, expires_delta=access_token_expires)

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/preferences/{email}", response_model=NotificationPreferences)
async def get_preferences(email: str, token: str = Depends(oauth2_scheme)):
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "notification_preferences" not in user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification preferences not found")

    return user["notification_preferences"]

@app.patch("/users/{email}/preferences", status_code=status.HTTP_200_OK)
async def update_preferences(email: str, preferences: NotificationPreferences, token: str = Depends(oauth2_scheme)):

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_result = users_collection.update_one({"_id": user["_id"]},
                                                {"$set": {"notification_preferences": preferences.dict()}})

    if update_result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="Preferences not updated")

    return {"status": "success", "message": "Notification preferences updated"}

@app.get("/send-notifications", status_code=status.HTTP_200_OK)
async def send_notifications():
    await send_notifications_to_users()
    return {"status": "success", "message": "Notifications sent"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=True)
