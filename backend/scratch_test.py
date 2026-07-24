import sys
sys.path.append(r"x:\Millionaire\CreatorOS\backend")
from instagrapi import Client

cl = Client()
try:
    cl.login_by_sessionid("46117557457%3Aabcxyz%3A25")
    print("login_by_sessionid passed")
except Exception as e:
    print(f"login_by_sessionid failed: {e}")

try:
    user = cl.current_user()
    print(f"current_user passed: {user}")
except Exception as e:
    print(f"current_user failed: {e}")
