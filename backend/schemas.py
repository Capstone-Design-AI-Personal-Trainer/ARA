from datetime import datetime
from pydantic import BaseModel


class WorkoutSessionCreate(BaseModel):
    exercise_name: str
    score: int
    reps: int
    target_reps: int
    duration_sec: int
    calories: int
    reason: str


class WorkoutSessionResponse(WorkoutSessionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True