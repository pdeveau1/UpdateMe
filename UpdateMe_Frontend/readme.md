# UpdateMe Backend API

This is the backend API for the UpdateMe app, which sends personalized notifications to users based on their preferences. It utilizes FastAPI and provides endpoints for user registration, login, managing notification preferences, and fetching the last sent notification. The app sends weather updates, stock prices, and top news headlines.

## Getting Started

These instructions will help you set up and run the project on your local machine for development and testing purposes.

View the API Docs at: https://fastapi-app-6keaqsjy5q-uk.a.run.app/docs

### Prerequisites

- Python 3.7 or higher
- MongoDB Atlas Account and Cluster
- SendGrid Account
- NewAPI Account
- AlphaVantage Account
- OpenWeatherMap Account

## Installation

1. Clone this repository:

```git clone https://github.com/pdeveau1/UpdateMe.git```

2. Create a virtual environment and activate it.

```
cd UpdateMe_Backend
python -m venv venv
source venv/bin/activate # For Linux/MacOS
venv\Scripts\activate # For Windows

```

3. Install the required packages:

```
pip install -r requirements.txt
```

4. Create a `.env` file with the following variables:

```
API_KEY_WEATHER = your_openweathermap_api_key
API_KEY_STOCKS = your_alphavantage_api_key
API_KEY_NEWS = your_newsapi_org_api_key
SENDGRID_API_KEY = your_sendgrid_api_key
```

Replace the placeholders with your API keys.

5. Start the API server:
```
uvicorn main:app --reload
```


The API will be accessible at `http://127.0.0.1:8000`.

## Endpoints

- `/register` (POST): Register a new user
- `/login` (POST): Login an existing user
- `/preferences/{email}` (GET): Get user's notification preferences
- `/users/{email}/notification_on` (GET): Check if user's notifications are enabled
- `/users/{email}/preferences` (PATCH): Update user's notification preferences
- `/users/{email}/notification_on` (PATCH): Update user's notification status (on/off)
- `/send-notifications` (GET): Manually send notifications to users
- `/users/{email}` (DELETE): Delete a user
- `/users/{email}/last-notification` (GET): Get the last sent notification for a user

## Usage

To use the UpdateMe API, interact with the provided endpoints using your preferred API client, such as Postman, or the built-in FastAPI Swagger UI available at `http://127.0.0.1:8000/docs`.

Refer to the code for the expected request and response formats for each endpoint.


