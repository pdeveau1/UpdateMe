import httpx
import asyncio

API_KEY = "f6dd306c6f52a0080725d1bc7272222c"
async def get_weather(zip_code: str):
    url = f"http://api.openweathermap.org/data/2.5/weather?zip={zip_code}&appid={API_KEY}&units=imperial"

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


your_zip_code = "02119"


async def main():
    weather_data = await get_weather(your_zip_code)
    print(weather_data)


if __name__ == "__main__":
    asyncio.run(main())
