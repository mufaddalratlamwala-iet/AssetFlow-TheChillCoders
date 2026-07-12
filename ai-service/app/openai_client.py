from openai import OpenAI
from app.config import settings

# Single shared client instance for the whole app.
client = OpenAI(api_key=settings.openai_api_key)
