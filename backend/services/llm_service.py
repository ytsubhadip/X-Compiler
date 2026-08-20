import os

from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()

#configer LL model 
Mistral_model = ChatMistralAI(
    model="mistral-small-latest",
    temperature=0.5,
    api_key= os.getenv("MISTRAL_API"),
    max_tokens=100
)

