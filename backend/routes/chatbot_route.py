from fastapi import APIRouter
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, AIMessage

from services.llm_service import Mistral_model

route = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
    )

chat_history = []

class UserPrompt(BaseModel):
    message:str

@route.post("/")
async def chat(request: UserPrompt):

    chat_history.append(HumanMessage( content= request.message))    
    response = Mistral_model.invoke(chat_history)
    chat_history.append(AIMessage(content=response.text))

    return {
        "responaes":response.text
    }