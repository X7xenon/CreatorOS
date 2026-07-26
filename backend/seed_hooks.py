"""
Seed script: Populates HookTemplate table with 50+ high-quality hooks.
Run once: python seed_hooks.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal, engine, Base
import models.scripting  # Register models
Base.metadata.create_all(bind=engine)

import uuid
from models.scripting import HookTemplate

HOOKS = [
    # CURIOSITY
    {"category": "Curiosity", "template": "What if I told you that {topic} is completely wrong?", "tone": "Provocative"},
    {"category": "Curiosity", "template": "Nobody is talking about this secret in {niche}...", "tone": "Mysterious"},
    {"category": "Curiosity", "template": "Here's the {topic} trick that {famous_person} doesn't want you to know.", "tone": "Conspiracy"},
    {"category": "Curiosity", "template": "I spent {time_period} researching {topic} so you don't have to.", "tone": "Helpful"},
    {"category": "Curiosity", "template": "The reason 99% of people fail at {topic} is not what you think.", "tone": "Surprising"},

    # FEAR
    {"category": "Fear", "template": "If you're still doing {bad_habit}, stop right now.", "tone": "Urgent"},
    {"category": "Fear", "template": "You're losing {resource} every single day because of {mistake}.", "tone": "Loss-Aversion"},
    {"category": "Fear", "template": "{topic} is dying — and most people have no idea.", "tone": "Alarming"},
    {"category": "Fear", "template": "This {topic} mistake could cost you everything.", "tone": "Warning"},
    {"category": "Fear", "template": "In {timeframe}, {negative_outcome} — here's how to avoid it.", "tone": "Preventative"},

    # STORY
    {"category": "Story", "template": "One year ago, I had {negative_situation}. Today, {positive_outcome}.", "tone": "Transformation"},
    {"category": "Story", "template": "I failed {number} times at {topic} before I discovered this.", "tone": "Honest"},
    {"category": "Story", "template": "The day {dramatic_event} changed how I think about {topic} forever.", "tone": "Dramatic"},
    {"category": "Story", "template": "I quit {thing} for {time_period}. Here's what happened.", "tone": "Experiment"},
    {"category": "Story", "template": "My {mentor/hero} told me one thing about {topic} that changed my life.", "tone": "Personal"},

    # QUESTION
    {"category": "Question", "template": "Why do {group of people} always {do something}?", "tone": "Investigative"},
    {"category": "Question", "template": "Have you ever wondered why {surprising_fact}?", "tone": "Curious"},
    {"category": "Question", "template": "What would happen if you {bold_action} for {time_period}?", "tone": "Challenge"},
    {"category": "Question", "template": "Is {popular_belief} actually true? I tested it.", "tone": "Myth-Busting"},
    {"category": "Question", "template": "What's the real difference between {thing_A} and {thing_B}?", "tone": "Comparative"},

    # MYTH
    {"category": "Myth", "template": "Everything you know about {topic} is wrong.", "tone": "Bold"},
    {"category": "Myth", "template": "The {topic} advice everyone gives is actually terrible.", "tone": "Contrarian"},
    {"category": "Myth", "template": "Stop believing this {topic} myth — it's costing you.", "tone": "Direct"},
    {"category": "Myth", "template": "The {number} biggest {topic} myths — debunked with data.", "tone": "Educational"},
    {"category": "Myth", "template": "You've been doing {topic} wrong your entire life.", "tone": "Provocative"},

    # MISTAKE
    {"category": "Mistake", "template": "I made {number} mistakes in {topic} — here's what I learned.", "tone": "Vulnerable"},
    {"category": "Mistake", "template": "Don't make the same {topic} mistake I made.", "tone": "Warning"},
    {"category": "Mistake", "template": "The {topic} mistake that cost me {resource/time/money}.", "tone": "Cautionary"},
    {"category": "Mistake", "template": "Here's what I wish I knew before starting {topic}.", "tone": "Retrospective"},
    {"category": "Mistake", "template": "{number} {topic} mistakes that beginners always make.", "tone": "Educational"},

    # STATISTICS
    {"category": "Statistics", "template": "{percentage}% of people will never achieve {goal} — here's why.", "tone": "Sobering"},
    {"category": "Statistics", "template": "According to {study}, {surprising_stat}. This changes everything.", "tone": "Authoritative"},
    {"category": "Statistics", "template": "In {year}, {topic} grew by {percentage}%. This is what it means.", "tone": "Data-Driven"},
    {"category": "Statistics", "template": "Only {number} in {larger_number} people know this about {topic}.", "tone": "Exclusive"},
    {"category": "Statistics", "template": "The data is clear: {conclusion}. Here's the breakdown.", "tone": "Analytical"},

    # CHALLENGE
    {"category": "Challenge", "template": "I did {activity} every day for {time_period}. The results shocked me.", "tone": "Experiment"},
    {"category": "Challenge", "template": "Can you {difficult_task} in {short_time}? I tried.", "tone": "Dare"},
    {"category": "Challenge", "template": "{time_period} {topic} challenge: Day {number} update.", "tone": "Series"},
    {"category": "Challenge", "template": "What happens when you {extreme_action} for {time_period}?", "tone": "Bold"},
    {"category": "Challenge", "template": "I challenged myself to {goal} — here's everything that went wrong.", "tone": "Transparent"},

    # POV
    {"category": "POV", "template": "Unpopular opinion: {topic} is overrated.", "tone": "Contrarian"},
    {"category": "POV", "template": "As a {professional_role}, here's my honest take on {topic}.", "tone": "Expert"},
    {"category": "POV", "template": "Hot take: {controversial_statement}. Hear me out.", "tone": "Provocative"},
    {"category": "POV", "template": "After {time_period} in {industry}, here's what I actually think.", "tone": "Experienced"},
    {"category": "POV", "template": "Everyone in {niche} is getting {topic} wrong — here's my take.", "tone": "Leadership"},

    # EMOTIONAL
    {"category": "Emotional", "template": "This is the {topic} story that nobody talks about.", "tone": "Empathetic"},
    {"category": "Emotional", "template": "I almost gave up on {goal} — until this happened.", "tone": "Vulnerable"},
    {"category": "Emotional", "template": "If you've ever felt {emotion} about {topic}, this is for you.", "tone": "Relatable"},
    {"category": "Emotional", "template": "The real reason {group} struggles with {topic}.", "tone": "Compassionate"},
    {"category": "Emotional", "template": "Nobody told me {truth_about_topic} — so I'm telling you.", "tone": "Honest"},

    # PREDICTION
    {"category": "Prediction", "template": "In {timeframe}, {prediction} — and most people aren't ready.", "tone": "Futuristic"},
    {"category": "Prediction", "template": "{topic} is about to change completely. Here's what's coming.", "tone": "Anticipatory"},
    {"category": "Prediction", "template": "Why {trend} will be dead by {year}.", "tone": "Bold Prediction"},
    {"category": "Prediction", "template": "The future of {topic} — based on {evidence}.", "tone": "Analytical"},
    {"category": "Prediction", "template": "I predict {outcome} will happen in {niche} within {timeframe}.", "tone": "Assertive"},
]

def seed():
    db = SessionLocal()
    try:
        existing = db.query(HookTemplate).count()
        if existing > 0:
            print(f"Already seeded: {existing} hooks found. Skipping.")
            return
            
        for hook in HOOKS:
            obj = HookTemplate(
                id=str(uuid.uuid4()),
                category=hook["category"],
                template=hook["template"],
                tone=hook.get("tone", "Neutral"),
                difficulty="Beginner",
                language="en",
                variables=[]
            )
            db.add(obj)
        db.commit()
        print(f"Seeded {len(HOOKS)} hook templates successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
