##imports##
from datetime import datetime, timedelta, timezone
from fastapi import Depends,FastAPI,APIRouter
from app.routes.auth_routes import auth_router
from app.routes.meet_routes import meet_router
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import ssl
##routes
app=FastAPI()
app.include_router(auth_router)
app.include_router(meet_router)
# app.include_router(ws_router)

# handling https
# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# ssl_context.load_cert_chain(r'app/cert.pem', keyfile=r'app/key.pem')

# Add CORS middleware for WebSocket support
app.add_middleware(
    CORSMiddleware,
     allow_origins=[
    "http://localhost:8080",
    "https://samaconnect-learn-link.vercel.app",
    "https://regardless-responsibilities-lance-allows.trycloudflare.com",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://192.168.43.178:8080",
    "https://192.168.43.178:8080",
    "https://8c99d3e5-15bf-46b6-abe0-82aeef24e2ac.lovableproject.com",
    "https://id-preview--8c99d3e5-15bf-46b6-abe0-82aeef24e2ac.lovable.app",
    "http://localhost:8080",
    "http://localhost:8082",
    "http://localhost:9000"
],
allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def greet():
    return "Hello, World!"

if __name__=="__main__":
    uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    # ssl=ssl_context
)

  
# uvicorn app.app:app --reload   --> this works on terminal
