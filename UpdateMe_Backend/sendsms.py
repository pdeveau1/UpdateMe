# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client
# Set environment variables for your credentials
# Read more at http://twil.io/secure
TWILIO_ACCOUNT_SID = "ACa14794880c14ac9ff449b1ff4f512486"
TWILIO_AUTH_TOKEN = "f0a016122476849a2b8ebed29b6d33f1"
TWILIO_PHONE_NUMBER = "+18338451705"
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
message = client.messages.create(
  body="Hello from Twilio",
  from_="+18338451705",
  to="+16177845004"
)
print(message.sid)