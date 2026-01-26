# #!/usr/bin/env python3
# """
# UGo Student Management System Launcher
# Checks requirements and starts the Electron app
# """

# import os
# import sys
# import subprocess
# import platform
# from pathlib import Path

# # Get the project root directory (2 levels up from this script)
# SCRIPT_DIR = Path(__file__).parent.resolve()
# PROJECT_ROOT = SCRIPT_DIR.parent.parent

# # Paths
# NODE_MODULES = PROJECT_ROOT / "node_modules"
# PACKAGE_JSON = PROJECT_ROOT / "package.json"
# MAIN_JS = PROJECT_ROOT / "src" / "main" / "index.js"

# def check_node_installed():
#     """Check if Node.js is installed"""
#     try:
#         result = subprocess.run(
#             ["node", "--version"], 
#             capture_output=True, 
#             text=True,
#             check=True,
#             shell=True  # ← Added shell=True
#         )
#         version = result.stdout.strip()
#         print(f"✓ Node.js found: {version}")
#         return True
#     except (subprocess.CalledProcessError, FileNotFoundError):
#         print("✗ Node.js not found!")
#         print("Please install Node.js from https://nodejs.org/")
#         return False

# def check_dependencies_installed():
#     """Check if node_modules exists"""
#     if NODE_MODULES.exists() and (NODE_MODULES / "electron").exists():
#         print("✓ Dependencies installed")
#         return True
#     else:
#         print("✗ Dependencies not installed")
#         return False

# def install_dependencies():
#     """Install npm dependencies"""
#     print("\nInstalling dependencies...")
#     print("This may take a few minutes on first run...")
    
#     try:
#         subprocess.run(
#             ["npm", "install"],
#             cwd=PROJECT_ROOT,
#             check=True,
#             shell=True  # ← Added shell=True
#         )
#         print("✓ Dependencies installed successfully")
#         return True
#     except subprocess.CalledProcessError as e:
#         print(f"✗ Failed to install dependencies: {e}")
#         return False

# def start_electron_app():
#     """Start the Electron application"""
#     print("\n" + "="*50)
#     print("Starting UGo Student Management System...")
#     print("="*50 + "\n")
    
#     try:
#         # Change to project root
#         os.chdir(PROJECT_ROOT)
        
#         # Start the app - Use shell=True on Windows
#         if platform.system() == "Windows":
#             # On Windows, use cmd to run npm
#             subprocess.run(
#                 "npm start",  # ← Changed to string
#                 shell=True,   # ← Added shell=True
#                 check=True
#             )
#         else:
#             # On Unix-like systems
#             subprocess.run(["npm", "start"], check=True)
            
#     except subprocess.CalledProcessError as e:
#         print(f"\n✗ Error starting application: {e}")
#         return False
#     except KeyboardInterrupt:
#         print("\n\nApplication closed by user")
#         return True
    
#     return True

# def main():
#     """Main launcher function"""
#     print("="*50)
#     print("UGo Student Management System Launcher")
#     print("="*50 + "\n")
    
#     # Check Node.js
#     if not check_node_installed():
#         input("\nPress Enter to exit...")
#         sys.exit(1)
    
#     # Check dependencies
#     if not check_dependencies_installed():
#         response = input("\nDependencies not found. Install now? (y/n): ")
#         if response.lower() == 'y':
#             if not install_dependencies():
#                 input("\nPress Enter to exit...")
#                 sys.exit(1)
#         else:
#             print("Cannot start without dependencies.")
#             input("\nPress Enter to exit...")
#             sys.exit(1)
    
#     # Start the app
#     if not start_electron_app():
#         input("\nPress Enter to exit...")
#         sys.exit(1)

# if __name__ == "__main__":
#     main()


#!/usr/bin/env python3
"""
UGo Student Management System Launcher
"""
import subprocess
import os
from pathlib import Path

# Get the project root directory (2 levels up from this script)
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent

def main():
    """Start the application"""
    # Change to project root
    os.chdir(PROJECT_ROOT)
    
    # Start the app
    print("Starting UGo Student Management System...\n")
    
    try:
        subprocess.run("npm start", shell=True, check=True)
    except KeyboardInterrupt:
        print("\nApplication closed")
    except Exception as e:
        print(f"\nError: {e}")
        input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()