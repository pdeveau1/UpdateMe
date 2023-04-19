import httpx
import asyncio

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


async def main():
    category = "business"  # Example: Technology
    top_news = await get_top_news(category)
    for news in top_news:
        print(news)


if __name__ == "__main__":
    asyncio.run(main())
