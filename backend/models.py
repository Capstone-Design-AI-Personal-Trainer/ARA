from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)

    exercise_name = Column(String, nullable=False)

    score = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    target_reps = Column(Integer, nullable=False)

    duration_sec = Column(Integer, nullable=False)
    calories = Column(Integer, nullable=False)

    reason = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())