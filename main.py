from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

class AnalyzeRequest(BaseModel):
    resume: str
    jobDescription: str
    keywords: list

@app.post("/keywords")
def keywords():
    return {"keywords": ["python","aws","ml","communication"]}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    vec = TfidfVectorizer().fit_transform([req.resume, req.jobDescription])
    sim = cosine_similarity(vec[0], vec[1])[0][0]
    score = sim * 100

    return {
        "ATS Score": round(score,2),
        "Missing Keywords": [k for k in req.keywords if k not in req.resume]
    }
