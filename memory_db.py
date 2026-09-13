import sqlite3
from datetime import datetime
from pathlib import Path

# DB file stored in local project directory
DB_PATH = Path(__file__).parent / "ultron_memory.db"


def get_db_connection() -> sqlite3.Connection:
    """Connect to SQLite database and set row factory to dictionary-like Row objects."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_memory_db():
    """Initialize the SQLite tables for persistent user facts and chat logs."""
    with get_db_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS user_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                category TEXT DEFAULT 'general',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chat_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
        conn.commit()
    print("[SQLITE MEMORY]: Database initialized successfully.")


# --- Fact Management Tools ---


def save_fact(key: str, value: str, category: str = "general") -> str:
    """Insert or update a key-value fact in long-term memory."""
    key = key.lower().strip()
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO user_facts (key, value, category, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                category = excluded.category,
                updated_at = CURRENT_TIMESTAMP
            """,
            (key, value, category),
        )
        conn.commit()
    return f"Fact stored: '{key}' = '{value}'"


def get_all_facts() -> list[dict]:
    """Retrieve all stored user facts."""
    with get_db_connection() as conn:
        cursor = conn.execute(
            "SELECT key, value, category FROM user_facts ORDER BY updated_at DESC"
        )
        return [dict(row) for row in cursor.fetchall()]


def query_facts(search_term: str) -> list[dict]:
    """Search for specific facts matching a key or value keyword."""
    term = f"%{search_term.lower().strip()}%"
    with get_db_connection() as conn:
        cursor = conn.execute(
            """
            SELECT key, value, category FROM user_facts 
            WHERE key LIKE ? OR value LIKE ? OR category LIKE ?
            ORDER BY updated_at DESC
            """,
            (term, term, term),
        )
        return [dict(row) for row in cursor.fetchall()]


# --- Chat History Persistence ---


def log_chat(role: str, content: str):
    """Save a chat message turn to persistent history."""
    if not content:
        return
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO chat_logs (role, content) VALUES (?, ?)",
            (role, content),
        )
        conn.commit()


def get_recent_chat_history(limit: int = 10) -> list[dict]:
    """Load the last N chat turns from SQLite on startup."""
    with get_db_connection() as conn:
        cursor = conn.execute(
            "SELECT role, content FROM chat_logs ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = cursor.fetchall()
        # Reverse to maintain chronological order
        return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]


if __name__ == "__main__":
    init_memory_db()