#!/usr/bin/env python3
"""
Setup script for Music Library Telegram Bot
"""
import os
import sys

def check_requirements():
    """Check if required dependencies are installed"""
    try:
        import aiogram
        import aiohttp
        import pydantic_settings
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    if not os.path.exists('.env'):
        print("❌ .env file not found")
        print("Please copy .env.example to .env and configure it")
        return False
    
    # Check for BOT_TOKEN
    with open('.env', 'r') as f:
        content = f.read()
        if 'BOT_TOKEN=YOUR_BOT_TOKEN_HERE' in content:
            print("⚠️  Please configure BOT_TOKEN in .env file")
            print("Get your bot token from @BotFather on Telegram")
            return False
    
    print("✅ .env file configured")
    return True

def main():
    """Main setup function"""
    print("🤖 Music Library Telegram Bot - Setup Check\\n")
    
    checks_passed = 0
    total_checks = 2
    
    if check_requirements():
        checks_passed += 1
    
    if check_env_file():
        checks_passed += 1
    
    print(f"\\n📊 Setup Status: {checks_passed}/{total_checks} checks passed")
    
    if checks_passed == total_checks:
        print("\\n🚀 Ready to run! Use: python -m app.main")
        return 0
    else:
        print("\\n❌ Please fix the issues above before running the bot")
        return 1

if __name__ == "__main__":
    sys.exit(main())