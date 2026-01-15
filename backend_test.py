#!/usr/bin/env python3

import requests
import sys
import json
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class ExpenseTrackerAPITester:
    def __init__(self, base_url="https://budget-buddy-4117.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def setup_test_user(self) -> bool:
        """Create test user and session using MongoDB"""
        try:
            timestamp = int(datetime.now().timestamp())
            user_id = f"test-user-{timestamp}"
            session_token = f"test_session_{timestamp}"
            
            # Create test user and session in MongoDB
            mongo_script = f"""
            use('test_database');
            var userId = '{user_id}';
            var sessionToken = '{session_token}';
            var expiresAt = new Date(Date.now() + 7*24*60*60*1000);
            
            // Insert test user
            db.users.insertOne({{
                user_id: userId,
                email: 'test.user.{timestamp}@example.com',
                name: 'Test User',
                picture: 'https://via.placeholder.com/150',
                created_at: new Date().toISOString()
            }});
            
            // Insert session
            db.user_sessions.insertOne({{
                user_id: userId,
                session_token: sessionToken,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString()
            }});
            
            // Create predefined categories
            var categories = [
                {{"name": "Food", "color": "#E15554"}},
                {{"name": "Transport", "color": "#3D9970"}},
                {{"name": "Bills", "color": "#2E4F4F"}},
                {{"name": "Shopping", "color": "#F59E0B"}},
                {{"name": "Entertainment", "color": "#8B5CF6"}},
                {{"name": "Healthcare", "color": "#EC4899"}},
                {{"name": "Other", "color": "#6B7280"}}
            ];
            
            categories.forEach(function(cat) {{
                db.categories.insertOne({{
                    category_id: 'cat_' + Math.random().toString(36).substr(2, 12),
                    user_id: userId,
                    name: cat.name,
                    color: cat.color,
                    is_predefined: true,
                    created_at: new Date().toISOString()
                }});
            }});
            
            print('SUCCESS: User and session created');
            """
            
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and 'SUCCESS' in result.stdout:
                self.session_token = session_token
                self.user_id = user_id
                self.log_test("Setup test user and session", True)
                return True
            else:
                self.log_test("Setup test user and session", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Setup test user and session", False, str(e))
            return False

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Make API request with authentication"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": "Invalid method"}
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return response.status_code < 400, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_endpoints(self) -> bool:
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me
        success, data = self.make_request('GET', 'auth/me')
        if success and data.get('user_id') == self.user_id:
            self.log_test("GET /auth/me", True)
        else:
            self.log_test("GET /auth/me", False, f"Response: {data}")
            return False
        
        # Test logout
        success, data = self.make_request('POST', 'auth/logout')
        if success:
            self.log_test("POST /auth/logout", True)
        else:
            self.log_test("POST /auth/logout", False, f"Response: {data}")
        
        return True

    def test_categories_endpoints(self) -> bool:
        """Test category management endpoints"""
        print("\n📂 Testing Category Endpoints...")
        
        # Get categories
        success, categories = self.make_request('GET', 'categories')
        if success and isinstance(categories, list) and len(categories) >= 7:
            self.log_test("GET /categories", True)
        else:
            self.log_test("GET /categories", False, f"Expected list with 7+ items, got: {categories}")
            return False
        
        # Create custom category
        category_data = {
            "name": "Test Category",
            "color": "#FF5733"
        }
        success, new_category = self.make_request('POST', 'categories', category_data)
        if success and new_category.get('name') == 'Test Category':
            self.log_test("POST /categories", True)
            category_id = new_category.get('category_id')
        else:
            self.log_test("POST /categories", False, f"Response: {new_category}")
            return False
        
        # Delete custom category
        if category_id:
            success, data = self.make_request('DELETE', f'categories/{category_id}')
            if success:
                self.log_test("DELETE /categories/{id}", True)
            else:
                self.log_test("DELETE /categories/{id}", False, f"Response: {data}")
        
        return True

    def test_expenses_endpoints(self) -> bool:
        """Test expense management endpoints"""
        print("\n💰 Testing Expense Endpoints...")
        
        # Get expenses (empty initially)
        success, expenses = self.make_request('GET', 'expenses')
        if success and isinstance(expenses, list):
            self.log_test("GET /expenses", True)
        else:
            self.log_test("GET /expenses", False, f"Expected list, got: {expenses}")
            return False
        
        # Create expense
        expense_data = {
            "title": "Test Expense",
            "amount": 500.50,
            "category": "Food",
            "date": "2024-01-15",
            "notes": "Test expense for API testing"
        }
        success, new_expense = self.make_request('POST', 'expenses', expense_data)
        if success and new_expense.get('title') == 'Test Expense':
            self.log_test("POST /expenses", True)
            expense_id = new_expense.get('expense_id')
        else:
            self.log_test("POST /expenses", False, f"Response: {new_expense}")
            return False
        
        # Update expense
        if expense_id:
            updated_data = {
                "title": "Updated Test Expense",
                "amount": 750.75,
                "category": "Transport",
                "date": "2024-01-16",
                "notes": "Updated test expense"
            }
            success, updated_expense = self.make_request('PUT', f'expenses/{expense_id}', updated_data)
            if success and updated_expense.get('title') == 'Updated Test Expense':
                self.log_test("PUT /expenses/{id}", True)
            else:
                self.log_test("PUT /expenses/{id}", False, f"Response: {updated_expense}")
        
        # Get expenses with month filter
        success, monthly_expenses = self.make_request('GET', 'expenses?month=2024-01')
        if success and isinstance(monthly_expenses, list):
            self.log_test("GET /expenses?month=2024-01", True)
        else:
            self.log_test("GET /expenses?month=2024-01", False, f"Response: {monthly_expenses}")
        
        # Delete expense
        if expense_id:
            success, data = self.make_request('DELETE', f'expenses/{expense_id}')
            if success:
                self.log_test("DELETE /expenses/{id}", True)
            else:
                self.log_test("DELETE /expenses/{id}", False, f"Response: {data}")
        
        return True

    def test_budgets_endpoints(self) -> bool:
        """Test budget management endpoints"""
        print("\n📊 Testing Budget Endpoints...")
        
        # Get budgets (empty initially)
        success, budgets = self.make_request('GET', 'budgets')
        if success and isinstance(budgets, list):
            self.log_test("GET /budgets", True)
        else:
            self.log_test("GET /budgets", False, f"Expected list, got: {budgets}")
            return False
        
        # Create budget
        budget_data = {
            "category": "Food",
            "amount": 5000.0,
            "month": "2024-01"
        }
        success, new_budget = self.make_request('POST', 'budgets', budget_data)
        if success and new_budget.get('category') == 'Food':
            self.log_test("POST /budgets", True)
        else:
            self.log_test("POST /budgets", False, f"Response: {new_budget}")
            return False
        
        return True

    def test_stats_endpoints(self) -> bool:
        """Test statistics endpoints"""
        print("\n📈 Testing Statistics Endpoints...")
        
        # Get monthly stats
        success, stats = self.make_request('GET', 'stats/monthly?month=2024-01')
        if success and 'month' in stats and 'total' in stats:
            self.log_test("GET /stats/monthly", True)
        else:
            self.log_test("GET /stats/monthly", False, f"Response: {stats}")
            return False
        
        return True

    def test_export_endpoints(self) -> bool:
        """Test export endpoints"""
        print("\n📥 Testing Export Endpoints...")
        
        # Test CSV export
        try:
            url = f"{self.base_url}/api/export/csv?month=2024-01"
            headers = {'Authorization': f'Bearer {self.session_token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200 and 'text/csv' in response.headers.get('content-type', ''):
                self.log_test("GET /export/csv", True)
            else:
                self.log_test("GET /export/csv", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET /export/csv", False, str(e))
            return False
        
        return True

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        try:
            if self.user_id:
                mongo_script = f"""
                use('test_database');
                db.users.deleteMany({{user_id: '{self.user_id}'}});
                db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
                db.categories.deleteMany({{user_id: '{self.user_id}'}});
                db.expenses.deleteMany({{user_id: '{self.user_id}'}});
                db.budgets.deleteMany({{user_id: '{self.user_id}'}});
                print('CLEANUP: Test data removed');
                """
                
                subprocess.run(['mongosh', '--eval', mongo_script], 
                             capture_output=True, text=True, timeout=30)
                print("🧹 Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup failed: {e}")

    def run_all_tests(self) -> bool:
        """Run all API tests"""
        print("🚀 Starting Expense Tracker API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Cannot proceed.")
            return False
        
        try:
            # Run all test suites
            auth_ok = self.test_auth_endpoints()
            categories_ok = self.test_categories_endpoints()
            expenses_ok = self.test_expenses_endpoints()
            budgets_ok = self.test_budgets_endpoints()
            stats_ok = self.test_stats_endpoints()
            export_ok = self.test_export_endpoints()
            
            # Print summary
            print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
            
            if self.tests_passed == self.tests_run:
                print("🎉 All tests passed!")
                return True
            else:
                print("⚠️  Some tests failed. Check details above.")
                return False
                
        finally:
            self.cleanup_test_data()

def main():
    tester = ExpenseTrackerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())