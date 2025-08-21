from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class SessionState(BaseModel):
    success_rate: float
    avg_time: float
    attempts: int

@app.post("/difficulty")
def difficulty(s: SessionState):
    # aturan sederhana: turunkan/naikkan tingkat
    if s.success_rate < 0.5 or s.attempts > 5:
        return {"level": "easy"}
    if s.success_rate > 0.8 and s.avg_time < 30:
        return {"level": "hard"}
    return {"level": "medium"}
