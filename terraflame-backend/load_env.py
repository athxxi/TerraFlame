"""Load terraflame-backend/.env without shell parsing (Neon URLs contain &)."""
import os
from pathlib import Path

_ROOT = Path(__file__).resolve().parent


def load_dotenv() -> None:
    path = _ROOT / '.env'
    if not path.is_file():
        return
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, val = line.partition('=')
        key = key.strip()
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if key:
            os.environ.setdefault(key, val)