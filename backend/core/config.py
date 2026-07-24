from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    sqlite_url: str = "sqlite:///./creatoros.db"
    whatsapp_target_number: str = ""
    reminder_schedules_minutes: list[int] = [1440, 60, 30, 10, 0]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
