from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
from models import WorkoutSession
from schemas import WorkoutSessionCreate, WorkoutSessionResponse

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "ARA Backend Running"}


@app.post("/sessions/end", response_model=WorkoutSessionResponse)
def end_session(session: WorkoutSessionCreate, db: Session = Depends(get_db)):
    new_session = WorkoutSession(
        exercise_name=session.exercise_name,
        score=session.score,
        reps=session.reps,
        target_reps=session.target_reps,
        duration_sec=session.duration_sec,
        calories=session.calories,
        reason=session.reason,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@app.get("/sessions", response_model=list[WorkoutSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(WorkoutSession).order_by(WorkoutSession.id.desc()).all()
    return sessions