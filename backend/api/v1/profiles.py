from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_profiles():
    return [
        {"id": "mrbeast", "name": "MrBeast Profile", "active": True},
        {"id": "mkbhd", "name": "MKBHD Profile", "active": False}
    ]

@router.get("/{profile_id}/memory")
def get_profile_memory(profile_id: str):
    return {"profile_id": profile_id, "memory": ["Prefers fast pacing", "High retention hooks"]}

@router.post("/{profile_id}/train")
def train_profile(profile_id: str):
    return {"status": "training", "profile_id": profile_id}

@router.get("/{profile_id}/fingerprint")
def get_profile_fingerprint(profile_id: str):
    return {
        "profile_id": profile_id,
        "fingerprint": {
            "pacing": 0.9,
            "storytelling": 0.8,
            "visuals": 0.95,
            "audio": 0.7
        }
    }
