from fastapi import APIRouter
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from services.llm_service import Mistral_model

route = APIRouter(
    tags=["chat"],
    prefix="/api/chat"
    )

PRODUCT_INFO = """
X Compiler is an online coding platform.

Features:
- Online code editor
- Code execution
- Supports Python, C, C++, Java and JavaScript
- provied Online editor
- Coding questions and test cases
- Student and teacher functionality
"""

SYSTEM_PROMPT = f"""
You are the official AI assistant for X Compiler.

PRODUCT:{PRODUCT_INFO}

Rules:
- Answer only questions about X Compiler, its features, usage, supported languages, and services.
- If a question is unrelated, politely say you can only help with X Compiler.
- Never invent company or product information.
- Keep answers short and clear.
- you not write any code if user asked you write a code .
- always try to reply short word under 100 word all user question.
- Important: Alwasy give me a paragrapt text not any list or table formate.
"""




class UserPrompt(BaseModel):
    message:str

@route.post("/")
async def chat(request: UserPrompt):
    chat_history = [
    SystemMessage(content=SYSTEM_PROMPT)]

    chat_history.append(HumanMessage( content= request.message))    
    response = Mistral_model.invoke(chat_history)
    

    return {
        "responaes":response.text
    }