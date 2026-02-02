#!/usr/bin/env python3

import os
import sys
import requests
import json
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://aiylthjfiqemwzxcgjnf.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_q7WroT0w59A1KAKNZIaCqw_XDvGmU2N"

class SupabaseAPITester:
    def __init__(self):
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.auth_url = f"{SUPABASE_URL}/auth/v1"
        self.headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, url, expected_status, data=None, headers=None):
        """Run a single API test"""
        test_headers = self.headers.copy()
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if response.text else {}
        
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic Supabase connectivity"""
        return self.run_test(
            "Basic Connectivity",
            "GET",
            f"{self.base_url}/system_criteria?select=count",
            200
        )

    def test_system_criteria(self):
        """Test system criteria loading"""
        return self.run_test(
            "System Criteria",
            "GET", 
            f"{self.base_url}/system_criteria",
            200
        )

    def test_all_enums(self):
        """Test all enums loading"""
        return self.run_test(
            "All Enums",
            "GET",
            f"{self.base_url}/all_enums",
            200
        )

    def test_auth_signup(self, email, password):
        """Test user signup"""
        return self.run_test(
            "User Signup",
            "POST",
            f"{self.auth_url}/signup",
            200,
            data={"email": email, "password": password}
        )

    def test_auth_signin(self, email, password):
        """Test user signin"""
        success, response = self.run_test(
            "User Signin",
            "POST",
            f"{self.auth_url}/token?grant_type=password",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            print(f"   Got access token: {self.user_token[:20]}...")
        
        return success, response

def main():
    print("=== SUPABASE API TESTING ===")
    
    tester = SupabaseAPITester()
    
    # Test basic connectivity
    tester.test_basic_connectivity()
    
    # Test data loading
    tester.test_system_criteria()
    tester.test_all_enums()
    
    # Test authentication
    timestamp = str(int(datetime.now().timestamp()))
    test_email = f"test_user_{timestamp}@example.com"
    test_password = "TestPassword123!"
    
    print(f"\n--- Testing with user: {test_email} ---")
    
    # Try signup
    tester.test_auth_signup(test_email, test_password)
    
    # Try signin
    tester.test_auth_signin(test_email, test_password)
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed < tester.tests_run:
        print("❌ Some tests failed - check Supabase configuration")
        return 1
    else:
        print("✅ All tests passed")
        return 0

if __name__ == "__main__":
    sys.exit(main())