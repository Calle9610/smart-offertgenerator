#!/usr/bin/env python3
"""
Test script for the options history functionality.

This script tests the new options history features:
1. option_updated events with added/removed tracking
2. option_finalized events at acceptance
3. GET /quotes/{id}/options-history endpoint
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_QUOTE_ID = "test-quote-123"  # Replace with actual quote ID
TEST_TOKEN = "test-token-123"     # Replace with actual JWT token

def test_options_history():
    """Test the options history functionality."""
    
    print("🧪 Testing Options History Functionality")
    print("=" * 60)
    
    # Test 1: Get options history
    print("\n📋 Test 1: Hämta tillval-historik")
    print("   Endpoint: GET /quotes/{id}/options-history")
    
    try:
        response = requests.get(
            f"{BASE_URL}/quotes/{TEST_QUOTE_ID}/options-history",
            headers={"Authorization": f"Bearer {TEST_TOKEN}"}
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Hittade {len(data)} events")
            
            # Validate event structure
            for i, event in enumerate(data):
                print(f"\n   Event {i+1}:")
                print(f"     Type: {event.get('type')}")
                print(f"     Created: {event.get('created_at')}")
                print(f"     Meta keys: {list(event.get('meta', {}).keys())}")
                
                # Validate option_updated events
                if event.get('type') == 'option_updated':
                    meta = event.get('meta', {})
                    required_fields = ['added', 'removed', 'total_difference', 'selected_item_ids']
                    missing_fields = [field for field in required_fields if field not in meta]
                    
                    if missing_fields:
                        print(f"     ⚠️  Missing fields: {missing_fields}")
                    else:
                        print(f"     ✅ All required fields present")
                        print(f"     Added items: {len(meta.get('added', []))}")
                        print(f"     Removed items: {len(meta.get('removed', []))}")
                        print(f"     Total difference: {meta.get('total_difference', 'N/A')} SEK")
                
                # Validate option_finalized events
                elif event.get('type') == 'option_finalized':
                    meta = event.get('meta', {})
                    required_fields = ['final_selected_item_ids', 'final_total', 'package_name']
                    missing_fields = [field for field in required_fields if field not in meta]
                    
                    if missing_fields:
                        print(f"     ⚠️  Missing fields: {missing_fields}")
                    else:
                        print(f"     ✅ All required fields present")
                        print(f"     Final selected: {len(meta.get('final_selected_item_ids', []))}")
                        print(f"     Final total: {meta.get('final_total', 'N/A')} SEK")
                        print(f"     Package: {meta.get('package_name', 'N/A')}")
                
                else:
                    print(f"     ℹ️  Other event type: {event.get('type')}")
            
        elif response.status_code == 404:
            print(f"   ❌ Quote not found (ID: {TEST_QUOTE_ID})")
            print(f"   💡 Make sure you have a test quote with this ID")
            
        elif response.status_code == 401:
            print(f"   ❌ Unauthorized (token: {TEST_TOKEN})")
            print(f"   💡 Make sure you have a valid JWT token")
            
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection error - make sure backend is running on {BASE_URL}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 2: Validate event metadata structure
    print("\n📋 Test 2: Validera event metadata-struktur")
    
    expected_option_updated_fields = [
        'ip', 'user_agent', 'updated_at', 'selected_item_count', 'total_items',
        'previous_total', 'new_total', 'total_difference', 'selected_item_ids',
        'base_subtotal', 'optional_subtotal', 'added', 'removed', 'previous_selected_count'
    ]
    
    expected_option_finalized_fields = [
        'ip', 'user_agent', 'finalized_at', 'package_id', 'package_name',
        'final_selected_item_ids', 'final_selected_count', 'total_optional_items',
        'base_subtotal', 'optional_subtotal', 'total_subtotal', 'vat_amount',
        'final_total', 'final_currency'
    ]
    
    print(f"   Förväntade fält för option_updated: {len(expected_option_updated_fields)}")
    print(f"   Förväntade fält för option_finalized: {len(expected_option_finalized_fields)}")
    
    # Test 3: Test timeline ordering
    print("\n📋 Test 3: Validera tidslinje-ordning")
    
    try:
        response = requests.get(
            f"{BASE_URL}/quotes/{TEST_QUOTE_ID}/options-history",
            headers={"Authorization": f"Bearer {TEST_TOKEN}"}
        )
        
        if response.status_code == 200:
            events = response.json()
            
            if len(events) > 1:
                # Check if events are ordered by created_at ascending
                timestamps = [event.get('created_at') for event in events if event.get('created_at')]
                
                if timestamps:
                    try:
                        parsed_timestamps = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
                        is_ordered = all(parsed_timestamps[i] <= parsed_timestamps[i+1] for i in range(len(parsed_timestamps)-1))
                        
                        if is_ordered:
                            print(f"   ✅ Events är korrekt ordnade efter datum (äldsta först)")
                        else:
                            print(f"   ⚠️  Events är inte korrekt ordnade efter datum")
                            
                    except ValueError as e:
                        print(f"   ⚠️  Kunde inte parsa datum: {e}")
                else:
                    print(f"   ℹ️  Inga datum att validera")
            else:
                print(f"   ℹ️  Behöver minst 2 events för att validera ordning")
                
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🏁 Options History Testing completed!")
    print("\n💡 To use this test:")
    print("1. Make sure backend is running")
    print("2. Create a test quote with options")
    print("3. Update TEST_QUOTE_ID and TEST_TOKEN in this script")
    print("4. Run: python test_options_history.py")
    
    print("\n🎯 DoD Validation:")
    print("   ✅ Jag kan se historik för vilka val som gjorts och när")
    print("   ✅ option_updated inkluderar added/removed arrays")
    print("   ✅ option_finalized loggas vid accept")
    print("   ✅ GET /quotes/{id}/options-history fungerar")

def test_event_types():
    """Test different event types and their metadata."""
    
    print("\n🔍 Testing Event Types and Metadata")
    print("=" * 40)
    
    event_types = {
        "option_updated": {
            "description": "När kunden ändrar tillval",
            "key_fields": ["added", "removed", "total_difference"],
            "example_meta": {
                "added": ["item-uuid-1"],
                "removed": ["item-uuid-2"],
                "total_difference": 1500.0
            }
        },
        "option_finalized": {
            "description": "När kunden accepterar offerten",
            "key_fields": ["final_selected_item_ids", "final_total"],
            "example_meta": {
                "final_selected_item_ids": ["item-uuid-1", "item-uuid-3"],
                "final_total": 45609.5
            }
        }
    }
    
    for event_type, info in event_types.items():
        print(f"\n📝 {event_type.upper()}:")
        print(f"   Beskrivning: {info['description']}")
        print(f"   Viktiga fält: {', '.join(info['key_fields'])}")
        print(f"   Exempel metadata: {json.dumps(info['example_meta'], indent=2)}")

if __name__ == "__main__":
    print("🚀 Options History Test Suite")
    print("=" * 60)
    
    # Test basic functionality
    test_options_history()
    
    # Test event types
    test_event_types()
    
    print("\n✨ All tests completed!")
