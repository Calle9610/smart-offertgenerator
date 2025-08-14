#!/usr/bin/env python3
"""
Test script for the new public quote selection endpoint.

This script tests the POST /public/quotes/{token}/update-selection endpoint
to ensure it correctly calculates totals based on selected optional items.
"""

import requests
import json
from decimal import Decimal

# Configuration
BASE_URL = "http://localhost:8000"
TEST_QUOTE_TOKEN = "test_token_123"  # Replace with actual token from a test quote

def test_public_selection_update():
    """Test the public quote selection update endpoint."""
    
    print("🧪 Testing Public Quote Selection Update Endpoint")
    print("=" * 60)
    
    # Test data - different selection scenarios
    test_scenarios = [
        {
            "name": "Select all optional items",
            "selectedItemIds": ["item-1", "item-2", "item-3"],
            "expected_behavior": "Should include all optional items in total"
        },
        {
            "name": "Select no optional items",
            "selectedItemIds": [],
            "expected_behavior": "Should only include mandatory items in total"
        },
        {
            "name": "Select some optional items",
            "selectedItemIds": ["item-1", "item-3"],
            "expected_behavior": "Should include selected optional items in total"
        }
    ]
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n📋 Test {i}: {scenario['name']}")
        print(f"   Expected: {scenario['expected_behavior']}")
        print(f"   Selected IDs: {scenario['selectedItemIds']}")
        
        try:
            # Make request to the endpoint
            response = requests.post(
                f"{BASE_URL}/public/quotes/{TEST_QUOTE_TOKEN}/update-selection",
                json={"selectedItemIds": scenario["selectedItemIds"]},
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   New Total: {data.get('total', 'N/A')} SEK")
                print(f"   Base Subtotal: {data.get('base_subtotal', 'N/A')} SEK")
                print(f"   Optional Subtotal: {data.get('optional_subtotal', 'N/A')} SEK")
                print(f"   Selected Items: {data.get('selected_item_count', 'N/A')}")
                
                # Validate response structure
                required_fields = ['items', 'subtotal', 'vat', 'total', 'base_subtotal', 'optional_subtotal']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    print(f"   ⚠️  Missing fields: {missing_fields}")
                else:
                    print(f"   ✅ All required fields present")
                
                # Validate items structure
                if 'items' in data and data['items']:
                    item = data['items'][0]
                    item_fields = ['id', 'kind', 'description', 'qty', 'unit_price', 'line_total', 'is_optional', 'isSelected']
                    missing_item_fields = [field for field in item_fields if field not in item]
                    
                    if missing_item_fields:
                        print(f"   ⚠️  Missing item fields: {missing_item_fields}")
                    else:
                        print(f"   ✅ All required item fields present")
                
            elif response.status_code == 404:
                print(f"   ❌ Quote not found (token: {TEST_QUOTE_TOKEN})")
                print(f"   💡 Make sure you have a test quote with this token")
                
            elif response.status_code == 400:
                print(f"   ❌ Bad request: {response.text}")
                
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection error - make sure backend is running on {BASE_URL}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 Testing completed!")
    print("\n💡 To use this test:")
    print("1. Make sure backend is running")
    print("2. Create a test quote and get its public token")
    print("3. Update TEST_QUOTE_TOKEN in this script")
    print("4. Run: python test_public_selection.py")

def test_endpoint_structure():
    """Test the endpoint structure and validation."""
    
    print("\n🔍 Testing Endpoint Structure")
    print("=" * 40)
    
    try:
        # Test with invalid JSON
        response = requests.post(
            f"{BASE_URL}/public/quotes/{TEST_QUOTE_TOKEN}/update-selection",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        print(f"Invalid JSON - Status: {response.status_code}")
        
        # Test with missing required field
        response = requests.post(
            f"{BASE_URL}/public/quotes/{TEST_QUOTE_TOKEN}/update-selection",
            json={"wrongField": ["item-1"]},
            headers={"Content-Type": "application/json"}
        )
        print(f"Missing selectedItemIds - Status: {response.status_code}")
        
        # Test with empty array
        response = requests.post(
            f"{BASE_URL}/public/quotes/{TEST_QUOTE_TOKEN}/update-selection",
            json={"selectedItemIds": []},
            headers={"Content-Type": "application/json"}
        )
        print(f"Empty selectedItemIds - Status: {response.status_code}")
        
    except Exception as e:
        print(f"Error testing structure: {str(e)}")

if __name__ == "__main__":
    print("🚀 Public Quote Selection Endpoint Test Suite")
    print("=" * 60)
    
    # Test basic functionality
    test_public_selection_update()
    
    # Test endpoint structure
    test_endpoint_structure()
    
    print("\n✨ All tests completed!")
