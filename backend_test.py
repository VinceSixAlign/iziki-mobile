#!/usr/bin/env python3
"""
Backend Test for Real Estate Decision Assistant (Supabase)
Tests Supabase connectivity and basic database operations
"""

import os
import sys
import asyncio
from datetime import datetime
import json

# Add the frontend directory to path to import supabase client
sys.path.append('/app/frontend/src')

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Supabase client not available. Installing...")
    os.system("pip install supabase")
    from supabase import create_client, Client

class SupabaseAPITester:
    def __init__(self):
        # Use the same credentials as the frontend
        self.supabase_url = "https://aiylthjfiqemwzxcgjnf.supabase.co"
        self.supabase_key = "sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N"
        self.supabase: Client = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
                return True
            else:
                print(f"❌ Failed - {name}")
                return False
        except Exception as e:
            print(f"❌ Failed - {name}: {str(e)}")
            return False

    def test_supabase_connection(self):
        """Test Supabase client initialization"""
        try:
            self.supabase = create_client(self.supabase_url, self.supabase_key)
            print("✅ Supabase client initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Supabase connection failed: {str(e)}")
            return False

    def test_system_criteria_fetch(self):
        """Test fetching system criteria"""
        try:
            response = self.supabase.table('system_criteria').select('*').execute()
            criteria_count = len(response.data)
            print(f"✅ Found {criteria_count} system criteria")
            return criteria_count > 0
        except Exception as e:
            print(f"❌ System criteria fetch failed: {str(e)}")
            return False

    def test_all_enums_fetch(self):
        """Test fetching all enums"""
        try:
            response = self.supabase.table('all_enums').select('*').execute()
            enums_count = len(response.data)
            print(f"✅ Found {enums_count} enum values")
            return enums_count > 0
        except Exception as e:
            print(f"❌ All enums fetch failed: {str(e)}")
            return False

    def test_user_signup(self):
        """Test user signup"""
        try:
            response = self.supabase.auth.sign_up({
                "email": self.test_user_email,
                "password": self.test_password
            })
            if response.user:
                print(f"✅ User signup successful: {self.test_user_email}")
                return True
            else:
                print("❌ User signup failed - no user returned")
                return False
        except Exception as e:
            print(f"❌ User signup failed: {str(e)}")
            return False

    def test_user_signin(self):
        """Test user signin"""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": self.test_user_email,
                "password": self.test_password
            })
            if response.user:
                print(f"✅ User signin successful: {self.test_user_email}")
                return True
            else:
                print("❌ User signin failed - no user returned")
                return False
        except Exception as e:
            print(f"❌ User signin failed: {str(e)}")
            return False

def main():
    """Main test execution"""
    print("🚀 Starting Supabase Backend Tests for Real Estate Decision Assistant")
    print("=" * 70)
    
    tester = SupabaseAPITester()
    
    # Run tests
    tests = [
        ("Supabase Connection", tester.test_supabase_connection),
        ("System Criteria Fetch", tester.test_system_criteria_fetch),
        ("All Enums Fetch", tester.test_all_enums_fetch),
        ("User Signup", tester.test_user_signup),
        ("User Signin", tester.test_user_signin),
    ]
    
    for test_name, test_func in tests:
        tester.run_test(test_name, test_func)
    
    # Print results
    print("\n" + "=" * 70)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Supabase backend is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())