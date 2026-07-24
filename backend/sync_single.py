from core.database import SessionLocal
from models.account import ConnectedAccount, Media
from core.security import decrypt_data
from providers.instagram import InstagrapiProvider
from datetime import datetime
import time

db = SessionLocal()
account = db.query(ConnectedAccount).filter(ConnectedAccount.username == 'theabeerexperience').first()
session_data = decrypt_data(account.encrypted_session_data)
provider = InstagrapiProvider()
print('Fetching media...')
medias = provider.fetch_recent_media(session_data, account.username, limit=12)
for m in medias:
    existing = db.query(Media).filter(Media.platform_media_id == m['platform_media_id']).first()
    if existing:
        existing.views = m['views']
        print(f"Updated {existing.id} views to {m['views']}")
db.commit()
print('Done')
