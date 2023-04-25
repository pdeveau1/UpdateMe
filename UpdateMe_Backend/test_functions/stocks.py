import httpx
import asyncio

API_KEY_STOCKS = "U4LE3AUN0DEJUK1E"
async def get_stock_price(symbol: str):
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={API_KEY_STOCKS}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ValueError("Failed to fetch stock data")

    data = response.json()
    print(data)
    stock_price = float(data["Global Quote"]["05. price"])

    return {"symbol": symbol, "price": stock_price}


async def main():
    symbol = "MSFT"  # Example: Microsoft Corporation
    stock_data = await get_stock_price(symbol)
    # print(stock_data)


if __name__ == "__main__":
    asyncio.run(main())
