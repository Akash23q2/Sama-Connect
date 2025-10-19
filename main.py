import subprocess
import sys
import os
from pathlib import Path

def run_servers():
    """Run both frontend and backend development servers concurrently."""
    project_root = Path(__file__).parent
    frontend_path = project_root / "frontend"
    
    # Check if frontend directory exists
    if not frontend_path.exists():
        print(f"Error: Frontend directory not found at {frontend_path}")
        sys.exit(1)
    
    print("🚀 Starting development servers...")
    print("Press Ctrl+C to stop\n")
    
    try:
        # Windows-compatible command using shell
        if sys.platform == "win32":
            cmd = f'cd frontend && npm run dev & cd .. && uv run uvicorn app.app:app --reload'
        else:
            cmd = 'cd frontend && npm run dev & cd .. && uv run uvicorn app.app:app --reload'
        
        subprocess.run(cmd, shell=True, cwd=project_root)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down servers...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_servers()