import sys
sys.path.append(r"x:\Millionaire\CreatorOS\backend")
from workers.collector import sync_daily_snapshots, sync_recent_media

print("Running manual sync...")
sync_daily_snapshots()
sync_recent_media()
print("Sync complete!")
