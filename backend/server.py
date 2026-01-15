from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from io import BytesIO
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    user_id: str
    name: str
    color: str
    is_predefined: bool = False
    created_at: datetime

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    expense_id: str
    user_id: str
    title: str
    amount: float
    category: str
    date: datetime
    notes: Optional[str] = None
    created_at: datetime

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    budget_id: str
    user_id: str
    category: str
    amount: float
    month: str
    created_at: datetime

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    color: str

class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: str

async def get_current_user(request: Request) -> str:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session_doc["user_id"]

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        data = resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": data["email"]},
            {"$set": {
                "name": data["name"],
                "picture": data.get("picture")
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        
        predefined_categories = [
            {"name": "Food", "color": "#E15554"},
            {"name": "Transport", "color": "#3D9970"},
            {"name": "Bills", "color": "#2E4F4F"},
            {"name": "Shopping", "color": "#F59E0B"},
            {"name": "Entertainment", "color": "#8B5CF6"},
            {"name": "Healthcare", "color": "#EC4899"},
            {"name": "Other", "color": "#6B7280"}
        ]
        
        for cat in predefined_categories:
            cat_doc = {
                "category_id": f"cat_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "name": cat["name"],
                "color": cat["color"],
                "is_predefined": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(cat_doc)
    
    session_token = data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user and isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return User(**user)

@api_router.get("/auth/me")
async def get_me(request: Request):
    user_id = await get_current_user(request)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get("created_at"), str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    
    return User(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/expenses")
async def get_expenses(request: Request, month: Optional[str] = None):
    user_id = await get_current_user(request)
    
    query = {"user_id": user_id}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    for exp in expenses:
        if isinstance(exp.get("date"), str):
            exp["date"] = datetime.fromisoformat(exp["date"])
        if isinstance(exp.get("created_at"), str):
            exp["created_at"] = datetime.fromisoformat(exp["created_at"])
    
    return expenses

@api_router.post("/expenses")
async def create_expense(request: Request, expense_data: ExpenseCreate):
    user_id = await get_current_user(request)
    
    expense_doc = {
        "expense_id": f"exp_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "title": expense_data.title,
        "amount": expense_data.amount,
        "category": expense_data.category,
        "date": expense_data.date,
        "notes": expense_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.expenses.insert_one(expense_doc)
    
    if isinstance(expense_doc.get("date"), str):
        expense_doc["date"] = datetime.fromisoformat(expense_doc["date"])
    if isinstance(expense_doc.get("created_at"), str):
        expense_doc["created_at"] = datetime.fromisoformat(expense_doc["created_at"])
    
    return Expense(**expense_doc)

@api_router.put("/expenses/{expense_id}")
async def update_expense(request: Request, expense_id: str, expense_data: ExpenseCreate):
    user_id = await get_current_user(request)
    
    result = await db.expenses.update_one(
        {"expense_id": expense_id, "user_id": user_id},
        {"$set": {
            "title": expense_data.title,
            "amount": expense_data.amount,
            "category": expense_data.category,
            "date": expense_data.date,
            "notes": expense_data.notes
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense = await db.expenses.find_one({"expense_id": expense_id}, {"_id": 0})
    
    if isinstance(expense.get("date"), str):
        expense["date"] = datetime.fromisoformat(expense["date"])
    if isinstance(expense.get("created_at"), str):
        expense["created_at"] = datetime.fromisoformat(expense["created_at"])
    
    return Expense(**expense)

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(request: Request, expense_id: str):
    user_id = await get_current_user(request)
    
    result = await db.expenses.delete_one({"expense_id": expense_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense deleted"}

@api_router.get("/categories")
async def get_categories(request: Request):
    user_id = await get_current_user(request)
    
    categories = await db.categories.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    for cat in categories:
        if isinstance(cat.get("created_at"), str):
            cat["created_at"] = datetime.fromisoformat(cat["created_at"])
    
    return categories

@api_router.post("/categories")
async def create_category(request: Request, category_data: CategoryCreate):
    user_id = await get_current_user(request)
    
    category_doc = {
        "category_id": f"cat_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "name": category_data.name,
        "color": category_data.color,
        "is_predefined": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(category_doc)
    
    if isinstance(category_doc.get("created_at"), str):
        category_doc["created_at"] = datetime.fromisoformat(category_doc["created_at"])
    
    return Category(**category_doc)

@api_router.delete("/categories/{category_id}")
async def delete_category(request: Request, category_id: str):
    user_id = await get_current_user(request)
    
    category = await db.categories.find_one({"category_id": category_id, "user_id": user_id}, {"_id": 0})
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.get("is_predefined"):
        raise HTTPException(status_code=400, detail="Cannot delete predefined category")
    
    result = await db.categories.delete_one({"category_id": category_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted"}

@api_router.get("/budgets")
async def get_budgets(request: Request):
    user_id = await get_current_user(request)
    
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    for budget in budgets:
        if isinstance(budget.get("created_at"), str):
            budget["created_at"] = datetime.fromisoformat(budget["created_at"])
    
    return budgets

@api_router.post("/budgets")
async def create_budget(request: Request, budget_data: BudgetCreate):
    user_id = await get_current_user(request)
    
    existing = await db.budgets.find_one({
        "user_id": user_id,
        "category": budget_data.category,
        "month": budget_data.month
    })
    
    if existing:
        await db.budgets.update_one(
            {"user_id": user_id, "category": budget_data.category, "month": budget_data.month},
            {"$set": {"amount": budget_data.amount}}
        )
        existing["amount"] = budget_data.amount
        if isinstance(existing.get("created_at"), str):
            existing["created_at"] = datetime.fromisoformat(existing["created_at"])
        return Budget(**existing)
    
    budget_doc = {
        "budget_id": f"budget_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "category": budget_data.category,
        "amount": budget_data.amount,
        "month": budget_data.month,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.budgets.insert_one(budget_doc)
    
    if isinstance(budget_doc.get("created_at"), str):
        budget_doc["created_at"] = datetime.fromisoformat(budget_doc["created_at"])
    
    return Budget(**budget_doc)

@api_router.get("/stats/monthly")
async def get_monthly_stats(request: Request, month: str):
    user_id = await get_current_user(request)
    
    expenses = await db.expenses.find({
        "user_id": user_id,
        "date": {"$regex": f"^{month}"}
    }, {"_id": 0}).to_list(1000)
    
    total = sum(exp["amount"] for exp in expenses)
    
    category_totals = {}
    for exp in expenses:
        cat = exp["category"]
        if cat not in category_totals:
            category_totals[cat] = 0
        category_totals[cat] += exp["amount"]
    
    return {
        "month": month,
        "total": total,
        "count": len(expenses),
        "by_category": category_totals
    }

@api_router.get("/export/csv")
async def export_csv(request: Request, month: Optional[str] = None):
    user_id = await get_current_user(request)
    
    query = {"user_id": user_id}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    csv_content = "Date,Title,Category,Amount,Notes\n"
    for exp in expenses:
        date = exp["date"] if isinstance(exp["date"], str) else exp["date"].isoformat()
        notes = exp.get("notes", "").replace(",", ";")
        csv_content += f"{date},{exp['title']},{exp['category']},{exp['amount']},{notes}\n"
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=expenses_{month or 'all'}.csv"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
