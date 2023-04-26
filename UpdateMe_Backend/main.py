from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, validator
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
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pytz import timezone, all_timezones
from dotenv import load_dotenv
import os
import sys
from fastapi.logger import logger
import logging
import re
from pydantic import ValidationError

logging.basicConfig(level=logging.INFO)
logger.handlers = []
handler = logging.StreamHandler(sys.stdout)
logger.addHandler(handler)
aps_logger = logging.getLogger("apscheduler")
aps_logger.setLevel(logging.ERROR)


load_dotenv()
API_KEY_WEATHER = os.getenv("API_KEY_WEATHER")
API_KEY_STOCKS = os.getenv("API_KEY_STOCKS")
API_KEY_NEWS = os.getenv("API_KEY_NEWS")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

class StocksPreferences(BaseModel):
    notify: bool
    stock_symbols: List[str]


class NewsPreferences(BaseModel):
    notify: bool
    category: str


class WeatherPreferences(BaseModel):
    notify: bool
    location_zipcode: str

    @validator("location_zipcode")
    def validate_zipcode(cls, value):
        if not re.match(r"^\d{5}(-\d{4})?$", value):
            raise ValueError("Invalid zipcode format")
        return value

class SentWeatherData(BaseModel):
    current_temp: float
    day_high: float
    day_low: float

class SentStockData(BaseModel):
    symbol: str
    price: float

class SentNewsData(BaseModel):
    title: str
    url: str
    source: str

class SentNotification(BaseModel):
    weather_data: Optional[SentWeatherData] = None
    stock_data: Optional[List[SentStockData]] = None
    news_data: Optional[List[SentNewsData]] = None

class NotificationPreferences(BaseModel):
    weather: Optional[WeatherPreferences]
    stocks: Optional[StocksPreferences]
    news: Optional[NewsPreferences]
    time_of_day: str
    timezone: str

    @validator("time_of_day")
    def validate_time_of_day(cls, value):
        if not re.match(r"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$", value):
            raise ValueError("Invalid time_of_day format, use HH:MM")
        return value

    @validator("timezone")
    def validate_timezone(cls, value):
        if value not in all_timezones:
            raise ValueError("Invalid timezone")
        return value
    
class User(BaseModel):
    id: Optional[str]
    email: EmailStr  # Use EmailStr to validate email format
    password: str
    first_name: str
    last_name: str
    notification_on: bool = False

    # Use a validator to ensure no fields are missing
    @validator('*', pre=True)
    def check_missing(cls, value, field):
        if value is None:
            raise ValueError(f"{field.name} must not be empty")
        return value

class UserWithNotificationPreferences(User):
    notification_preferences: Optional[NotificationPreferences] = None

class UserWithLastNotification(User):
    last_notification: Optional[SentNotification] = None

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


async def get_stock_price(symbol: str):
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={API_KEY_STOCKS}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ValueError("Failed to fetch stock data")

    data = response.json()
    stock_price = float(data['Global Quote']["05. price"])

    return {"symbol": symbol, "price": stock_price}


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

async def update_last_sent_notification(email: str, notification: SentNotification):
    logger.info(f"Updating notification preferences for user: {email}")

    user = users_collection.find_one({"email": email})

    if not user:
        logger.warning(f"User not found for email: {email}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        update_result = users_collection.update_one({"_id": user["_id"]},
                                                    {"$set": {"last_notification": notification.dict()}})
    except ValidationError as ve:
        logger.warning(f"Invalid notification preferences for email {email}: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid notification preferences")

    if update_result.modified_count == 0:
        logger.warning(f"Preferences not updated for email: {email}")
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="Preferences not updated")

    logger.info(f"Notification preferences updated for user: {email}")

    return {"status": "success", "message": "Notification preferences updated"}

async def send_notification(user: UserWithNotificationPreferences):
    content = ""

    preferences = user.notification_preferences
    sent_notification_data = {}

    if preferences.weather and preferences.weather.notify:
        weather_data = await get_weather(preferences.weather.location_zipcode)
        content += f"<h3>Weather:</h3><p>Current temp {weather_data['current_temp']}°F, High {weather_data['day_high']}°F, Low {weather_data['day_low']}°F</p>"
        sent_notification_data["weather_data"] = SentWeatherData(**weather_data)

    if preferences.stocks and preferences.stocks.notify:
        stock_symbols = preferences.stocks.stock_symbols
        stock_prices = await asyncio.gather(*(get_stock_price(symbol) for symbol in stock_symbols))
        stock_message = ", ".join([f"{sp['symbol']} ${sp['price']}" for sp in stock_prices])
        content += f"<h3>Stocks:</h3><p>{stock_message}</p>"
        sent_notification_data["stock_data"] = [SentStockData(**sp) for sp in stock_prices]

    if preferences.news and preferences.news.notify:
        top_news = await get_top_news(preferences.news.category)
        news_message = "<br>".join([f"{n['title']} - {n['source']} <a href='{n['url']}'>Read more</a>" for n in top_news])
        content += f"<h3>Top News:</h3><p>{news_message}</p>"
        sent_notification_data["news_data"] = [SentNewsData(**n) for n in top_news]

    sent_notification = SentNotification(**sent_notification_data)

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

    loop = asyncio.get_event_loop()
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = await loop.run_in_executor(None, sg.send, message)
        logger.info(f"Email sent to {user.email}, status: {response.status_code}")
        await update_last_sent_notification(user.email, sent_notification)

    except Exception as e:
        logger.info(f"Error sending email to {user.email}: {e}")


async def send_notifications_to_users():
    users = users_collection.find({})

    for user_data in users:
        if user_data["notification_on"] is False:
            continue

        user = UserWithNotificationPreferences.parse_obj(user_data)
        preferences = user.notification_preferences

        if not preferences:
            continue

        await send_notification(user)


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: User):
    # Log the incoming request
    logger.info(f"Attempting to register user: {user.email}")

    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        logger.warning(f"User with email {user.email} already exists")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    hashed_password = bcrypt.hash(user.password)
    user.password = hashed_password

    result = users_collection.insert_one(user.dict())

    logger.info(f"User {user.email} registered with ID: {str(result.inserted_id)}")

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

@app.get("/users/{email}/notification_on", response_model=bool)
async def get_notification_on(email: str, token: str = Depends(oauth2_scheme)):
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user["notification_on"]


@app.patch("/users/{email}/preferences", status_code=status.HTTP_200_OK)
async def update_preferences(email: str, preferences: NotificationPreferences, token: str = Depends(oauth2_scheme)):
    logger.info(f"Updating notification preferences for user: {email}")

    user = users_collection.find_one({"email": email})

    if not user:
        logger.warning(f"User not found for email: {email}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        update_result = users_collection.update_one({"_id": user["_id"]},
                                                    {"$set": {"notification_preferences": preferences.dict()}})
    except ValidationError as ve:
        logger.warning(f"Invalid notification preferences for email {email}: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid notification preferences")

    if update_result.modified_count == 0:
        logger.warning(f"Preferences not updated for email: {email}")
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="Preferences not updated")

    logger.info(f"Notification preferences updated for user: {email}")

    return {"status": "success", "message": "Notification preferences updated"}

@app.patch("/users/{email}/notification_on", status_code=status.HTTP_200_OK)
async def update_notification_on(email: str, notification_on: bool, token: str = Depends(oauth2_scheme)):
    logger.info(f"Updating notification_on for user: {email}")

    user = users_collection.find_one({"email": email})

    if not user:
        logger.warning(f"User not found for email: {email}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_result = users_collection.update_one({"_id": user["_id"]},
                                                {"$set": {"notification_on": notification_on}})

    if update_result.modified_count == 0:
        logger.warning(f"notification_on not updated for email: {email}")
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="notification_on not updated")

    logger.info(f"notification_on updated for user: {email}")

    return {"status": "success", "message": "notification_on updated"}


@app.get("/send-notifications", status_code=status.HTTP_200_OK)
async def send_notifications_manual():
    await send_notifications_to_users()
    return {"status": "success", "message": "Notifications sent"}

@app.delete("/users/{email}", status_code=status.HTTP_200_OK)
async def delete_user(email: str, token: str = Depends(oauth2_scheme)):
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    delete_result = users_collection.delete_one({"email": email})

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="User not deleted")

    return {"status": "success", "message": "User deleted"}

@app.get("/users/{email}/last-notification", response_model=SentNotification)
async def get_last_notification(email: str, token: str = Depends(oauth2_scheme)):
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "last_notification" not in user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Last notification not found")

    return SentNotification(**user["last_notification"])


async def send_notifications_at_scheduled_time():
    users = users_collection.find({})

    for user_data in users:
        if user_data["notification_on"] is False:
            continue

        user = UserWithNotificationPreferences.parse_obj(user_data)
        preferences = user.notification_preferences

        if not preferences:
            continue

        user_timezone = timezone(preferences.timezone)
        current_time = datetime.datetime.now(user_timezone)
        time_of_day = current_time.strftime('%H:%M')

        if time_of_day == preferences.time_of_day:
            await send_notification(user)


async def send_notifications():
    users = users_collection.find({})

    for user_data in users:
        user = UserWithNotificationPreferences.parse_obj(user_data)
        await send_notification(user)

scheduler = AsyncIOScheduler()
scheduler.add_job(send_notifications_at_scheduled_time, 'interval', minutes=1)
scheduler.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=True)
