from providers.base import PlatformProvider
from instagrapi import Client
from typing import Dict, Any, List, Optional
import json

class InstagrapiProvider(PlatformProvider):
    def _get_client(self, session_data: str = None, proxy_url: Optional[str] = None) -> Client:
        cl = Client()
        if session_data:
            settings = json.loads(session_data)
            cl.set_settings(settings)
        if proxy_url:
            cl.set_proxy(proxy_url)
        return cl

    def login(self, username: str, password: str, proxy_url: Optional[str] = None) -> tuple[str, str]:
        cl = self._get_client(proxy_url=proxy_url)
        cl.login(username, password)
        user_info = cl.user_info(cl.user_id)
        settings = cl.get_settings()
        return (user_info.username, json.dumps(settings))
        
    def login_with_session(self, sessionid: str, proxy_url: Optional[str] = None) -> tuple[str, str]:
        cl = self._get_client(proxy_url=proxy_url)
        cl.login_by_sessionid(sessionid)
        user_info = cl.user_info(cl.user_id)
        settings = cl.get_settings()
        return (user_info.username, json.dumps(settings))

    def fetch_profile(self, session_data: str, username: str, proxy_url: Optional[str] = None) -> Dict[str, Any]:
        cl = self._get_client(session_data, proxy_url=proxy_url)
        user_info = cl.user_info_by_username(username)
        return {
            "followers_count": user_info.follower_count,
            "following_count": user_info.following_count,
            "total_posts": user_info.media_count,
            "username": user_info.username,
            "full_name": user_info.full_name,
        }

    def fetch_recent_media(self, session_data: str, username: str, limit: int = 10, proxy_url: Optional[str] = None) -> List[Dict[str, Any]]:
        cl = self._get_client(session_data, proxy_url=proxy_url)
        user_id = cl.user_id_from_username(username)
        medias = cl.user_medias(user_id, amount=limit)
        
        results = []
        for media in medias:
            results.append({
                "platform_media_id": media.id,
                "media_type": "VIDEO" if media.media_type == 2 else ("CAROUSEL" if media.media_type == 8 else "IMAGE"),
                "caption": media.caption_text,
                "likes": media.like_count,
                "comments": media.comment_count,
                "views": (media.play_count or media.view_count) if media.media_type == 2 else 0,
                "thumbnail_url": str(media.thumbnail_url) if media.thumbnail_url else (str(media.resources[0].thumbnail_url) if media.resources else None),
                "created_at": media.taken_at,
            })
        return results
