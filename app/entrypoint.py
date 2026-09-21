"""Container entrypoint: apply migrations, then replace the process with uvicorn."""

from __future__ import annotations

import os
import subprocess
import sys


def main() -> None:
    """Run Alembic then exec uvicorn so signals reach the HTTP server."""
    subprocess.check_call([sys.executable, "-m", "alembic", "upgrade", "head"])
    host = os.environ.get("API_HOST", "0.0.0.0")
    port = os.environ.get("API_PORT", "8000")
    os.execvp(
        sys.executable,
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            host,
            "--port",
            port,
        ],
    )


if __name__ == "__main__":
    main()
