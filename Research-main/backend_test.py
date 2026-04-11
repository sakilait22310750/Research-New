#!/usr/bin/env python3
"""
AccommoBuddy Backend API Test Suite
Tests all backend endpoints for the accommodation recommendation system
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://accommo-buddy.preview.emergentagent.com/api"

class AccommoBuddyTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.auth_token = None
        self.test_user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, str(e), 0
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        test_data = {
            "email": "testuser@accommobuddy.com",
            "password": "SecurePass123!",
            "name": "Test User",
            "country": "Sri Lanka",
            "age_group": "25-34",
            "travel_frequency": "frequent",
            "preferences": ["beach", "luxury", "wifi"]
        }
        
        success, response, status_code = self.make_request("POST", "/auth/register", test_data)
        
        if success and "token" in response and "user" in response:
            self.auth_token = response["token"]
            self.test_user_id = response["user"]["id"]
            self.log_test("User Registration", True, f"User created with ID: {self.test_user_id}")
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status_code}", response)
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        test_data = {
            "email": "testuser@accommobuddy.com",
            "password": "SecurePass123!"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", test_data)
        
        if success and "token" in response and "user" in response:
            # Update token in case it's different
            self.auth_token = response["token"]
            self.log_test("User Login", True, f"Login successful for user: {response['user']['name']}")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status_code}", response)
            return False
    
    def test_get_user_profile(self):
        """Test get user profile endpoint"""
        if not self.auth_token:
            self.log_test("Get User Profile", False, "No auth token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, response, status_code = self.make_request("GET", "/user/profile", headers=headers)
        
        if success and "id" in response and "email" in response:
            self.log_test("Get User Profile", True, f"Profile retrieved for: {response['name']}")
            return True
        else:
            self.log_test("Get User Profile", False, f"Status: {status_code}", response)
            return False
    
    def test_update_user_profile(self):
        """Test update user profile endpoint"""
        if not self.auth_token:
            self.log_test("Update User Profile", False, "No auth token available")
            return False
        
        update_data = {
            "name": "Updated Test User",
            "country": "Sri Lanka",
            "preferences": ["beach", "luxury", "wifi", "spa"]
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, response, status_code = self.make_request("PUT", "/user/profile", update_data, headers)
        
        if success and "message" in response:
            self.log_test("Update User Profile", True, "Profile updated successfully")
            return True
        else:
            self.log_test("Update User Profile", False, f"Status: {status_code}", response)
            return False
    
    def test_get_hotels_list(self):
        """Test get hotels list endpoint"""
        success, response, status_code = self.make_request("GET", "/hotels")
        
        if success and isinstance(response, list) and len(response) > 0:
            hotel = response[0]
            required_fields = ["id", "hotel_id", "name", "location", "rating", "total_reviews"]
            
            if all(field in hotel for field in required_fields):
                self.log_test("Get Hotels List", True, f"Retrieved {len(response)} hotels")
                return True, response
            else:
                self.log_test("Get Hotels List", False, "Missing required fields in hotel data", hotel)
                return False, None
        else:
            self.log_test("Get Hotels List", False, f"Status: {status_code}", response)
            return False, None
    
    def test_get_hotels_with_filters(self):
        """Test get hotels with location and rating filters"""
        # Test location filter
        success, response, status_code = self.make_request("GET", "/hotels?location=Colombo&limit=10")
        
        if success and isinstance(response, list):
            self.log_test("Get Hotels with Location Filter", True, f"Retrieved {len(response)} hotels in Colombo")
        else:
            self.log_test("Get Hotels with Location Filter", False, f"Status: {status_code}", response)
        
        # Test rating filter
        success, response, status_code = self.make_request("GET", "/hotels?min_rating=4.0&limit=10")
        
        if success and isinstance(response, list):
            # Verify all hotels have rating >= 4.0
            valid_ratings = all(hotel.get("rating", 0) >= 4.0 for hotel in response)
            if valid_ratings:
                self.log_test("Get Hotels with Rating Filter", True, f"Retrieved {len(response)} hotels with rating >= 4.0")
            else:
                self.log_test("Get Hotels with Rating Filter", False, "Some hotels don't meet rating criteria")
        else:
            self.log_test("Get Hotels with Rating Filter", False, f"Status: {status_code}", response)
    
    def test_get_hotel_details(self, hotel_id: int = None):
        """Test get hotel details endpoint"""
        if not hotel_id:
            # Get a hotel ID from the hotels list first
            success, hotels, _ = self.make_request("GET", "/hotels?limit=1")
            if not success or not hotels:
                self.log_test("Get Hotel Details", False, "Could not get hotel ID for testing")
                return False
            hotel_id = hotels[0]["hotel_id"]
        
        success, response, status_code = self.make_request("GET", f"/hotels/{hotel_id}")
        
        if success and "hotel_id" in response:
            required_fields = ["id", "hotel_id", "name", "location", "rating", "reviews", "emotion_breakdown"]
            
            if all(field in response for field in required_fields):
                # Check emotion breakdown structure
                emotions = response["emotion_breakdown"]
                emotion_types = ["joy", "surprise", "neutral", "sadness", "anger", "fear"]
                
                if all(emotion in emotions for emotion in emotion_types):
                    self.log_test("Get Hotel Details", True, f"Hotel details retrieved with {len(response['reviews'])} reviews")
                    return True, response
                else:
                    self.log_test("Get Hotel Details", False, "Missing emotion breakdown data", emotions)
                    return False, None
            else:
                self.log_test("Get Hotel Details", False, "Missing required fields", response)
                return False, None
        else:
            self.log_test("Get Hotel Details", False, f"Status: {status_code}", response)
            return False, None
    
    def test_search_hotels(self):
        """Test hotel search endpoint"""
        # Test search by name
        success, response, status_code = self.make_request("GET", "/search?q=hotel&limit=10")
        
        if success and isinstance(response, list):
            self.log_test("Search Hotels by Name", True, f"Found {len(response)} hotels matching 'hotel'")
        else:
            self.log_test("Search Hotels by Name", False, f"Status: {status_code}", response)
        
        # Test search by location
        success, response, status_code = self.make_request("GET", "/search?q=Colombo&limit=10")
        
        if success and isinstance(response, list):
            self.log_test("Search Hotels by Location", True, f"Found {len(response)} hotels in Colombo area")
        else:
            self.log_test("Search Hotels by Location", False, f"Status: {status_code}", response)
    
    def test_get_recommendations(self):
        """Test personalized recommendations endpoint"""
        if not self.auth_token or not self.test_user_id:
            self.log_test("Get Recommendations", False, "No auth token or user ID available")
            return False
        
        request_data = {
            "user_id": self.test_user_id,
            "location": "Colombo",
            "limit": 10
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, response, status_code = self.make_request("POST", "/recommendations", request_data, headers)
        
        if success and isinstance(response, list):
            if len(response) > 0:
                # Check if recommendations have required fields
                rec = response[0]
                required_fields = ["id", "hotel_id", "name", "location", "rating", "recommendation_score"]
                
                if all(field in rec for field in required_fields):
                    # Verify no NaN or Inf values
                    valid_scores = all(
                        isinstance(rec.get("rating"), (int, float)) and 
                        isinstance(rec.get("recommendation_score"), (int, float))
                        for rec in response
                    )
                    
                    if valid_scores:
                        self.log_test("Get Recommendations", True, f"Retrieved {len(response)} personalized recommendations")
                        return True
                    else:
                        self.log_test("Get Recommendations", False, "Invalid numeric values in recommendations")
                        return False
                else:
                    self.log_test("Get Recommendations", False, "Missing required fields in recommendations", rec)
                    return False
            else:
                self.log_test("Get Recommendations", True, "No recommendations returned (empty result)")
                return True
        else:
            self.log_test("Get Recommendations", False, f"Status: {status_code}", response)
            return False
    
    def test_submit_feedback(self):
        """Test submit feedback endpoint"""
        if not self.auth_token or not self.test_user_id:
            self.log_test("Submit Feedback", False, "No auth token or user ID available")
            return False
        
        # Get a hotel ID first
        success, hotels, _ = self.make_request("GET", "/hotels?limit=1")
        if not success or not hotels:
            self.log_test("Submit Feedback", False, "Could not get hotel ID for feedback testing")
            return False
        
        feedback_data = {
            "user_id": self.test_user_id,
            "hotel_id": hotels[0]["hotel_id"],
            "rating": 4.5,
            "comment": "Great hotel with excellent service and beautiful location!"
        }
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        success, response, status_code = self.make_request("POST", "/feedback", feedback_data, headers)
        
        if success and "message" in response:
            self.log_test("Submit Feedback", True, "Feedback submitted successfully")
            return True
        else:
            self.log_test("Submit Feedback", False, f"Status: {status_code}", response)
            return False
    
    def test_data_integrity(self):
        """Test data integrity - check for NaN/Inf values and proper JSON structure"""
        success, hotels, _ = self.make_request("GET", "/hotels?limit=5")
        
        if not success:
            self.log_test("Data Integrity Check", False, "Could not retrieve hotels for integrity check")
            return False
        
        issues = []
        
        for hotel in hotels:
            # Check for NaN/Inf in numeric fields
            numeric_fields = ["rating", "total_reviews", "avg_sentiment_score"]
            for field in numeric_fields:
                value = hotel.get(field)
                if value is not None:
                    if str(value).lower() in ['nan', 'inf', '-inf']:
                        issues.append(f"Hotel {hotel.get('name', 'Unknown')}: {field} has invalid value: {value}")
        
        if issues:
            self.log_test("Data Integrity Check", False, f"Found {len(issues)} data integrity issues", issues)
            return False
        else:
            self.log_test("Data Integrity Check", True, "All numeric values are valid")
            return True
    
    def test_multilingual_reviews(self):
        """Test multilingual review support"""
        success, hotel_data, _ = self.test_get_hotel_details()
        
        if not success or not hotel_data:
            self.log_test("Multilingual Reviews Check", False, "Could not get hotel details for review testing")
            return False
        
        reviews = hotel_data.get("reviews", [])
        if not reviews:
            self.log_test("Multilingual Reviews Check", False, "No reviews found in hotel data")
            return False
        
        # Check if reviews have language labels
        language_labels = set()
        emotion_labels = set()
        
        for review in reviews[:10]:  # Check first 10 reviews
            if "language_label" in review:
                language_labels.add(review["language_label"])
            if "emotion_label" in review:
                emotion_labels.add(review["emotion_label"])
        
        expected_languages = {"en", "si", "ta"}
        expected_emotions = {"joy", "surprise", "neutral", "sadness", "anger", "fear"}
        
        lang_check = len(language_labels.intersection(expected_languages)) > 0
        emotion_check = len(emotion_labels.intersection(expected_emotions)) > 0
        
        if lang_check and emotion_check:
            self.log_test("Multilingual Reviews Check", True, f"Found languages: {language_labels}, emotions: {emotion_labels}")
            return True
        else:
            self.log_test("Multilingual Reviews Check", False, f"Missing language/emotion data. Languages: {language_labels}, Emotions: {emotion_labels}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting AccommoBuddy Backend API Tests")
        print("=" * 60)
        print()
        
        # Authentication flow tests
        print("🔐 Testing Authentication Flow...")
        auth_success = self.test_user_registration()
        if auth_success:
            self.test_user_login()
            self.test_get_user_profile()
            self.test_update_user_profile()
        
        print("\n🏨 Testing Hotel Endpoints...")
        # Hotel endpoints tests
        hotels_success, hotels_data = self.test_get_hotels_list()
        if hotels_success:
            self.test_get_hotels_with_filters()
            self.test_get_hotel_details()
            self.test_search_hotels()
        
        print("\n🎯 Testing Recommendation Engine...")
        # Recommendation tests
        if auth_success:
            self.test_get_recommendations()
            self.test_submit_feedback()
        
        print("\n🔍 Testing Data Quality...")
        # Data integrity tests
        self.test_data_integrity()
        self.test_multilingual_reviews()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        return failed_tests == 0

if __name__ == "__main__":
    tester = AccommoBuddyTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)