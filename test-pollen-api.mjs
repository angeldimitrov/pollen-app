#!/usr/bin/env node
/**
 * Standalone test for Google Pollen API
 * Verifies API key and connectivity independently of the browser app
 */

import { readFileSync } from 'fs';

// Load environment variables from .env file
function loadEnvFile() {
    try {
        const envContent = readFileSync('.env', 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return envVars;
    } catch (error) {
        console.error('Could not read .env file:', error.message);
        return {};
    }
}

const envVars = loadEnvFile();
const API_KEY = envVars.VITE_GOOGLE_API_KEY;
const API_URL = 'https://pollen.googleapis.com/v1/forecast:lookup';

/**
 * Test the Google Pollen API with a known location
 */
async function testPollenAPI() {
    console.log('🌿 Testing Google Pollen API...\n');
    
    // Check API key
    if (!API_KEY) {
        console.error('❌ Google API key not found in environment variables');
        console.log('Please ensure VITE_GOOGLE_API_KEY is set in your .env file');
        process.exit(1);
    }
    
    console.log('✅ API key found in environment');
    
    // Test locations
    const testLocations = [
        {
            name: 'San Francisco, CA',
            latitude: 37.7749,
            longitude: -122.4194
        },
        {
            name: 'London, UK',
            latitude: 51.5074,
            longitude: -0.1278
        },
        {
            name: 'Sydney, Australia',
            latitude: -33.8688,
            longitude: 151.2093
        }
    ];
    
    for (const location of testLocations) {
        console.log(`\n🔍 Testing location: ${location.name}`);
        
        try {
            // Build the URL with query parameters for GET request
            const params = new URLSearchParams({
                key: API_KEY,
                'location.latitude': location.latitude.toString(),
                'location.longitude': location.longitude.toString(),
                days: '3',
                plantsDescription: 'true'
            });
            
            const response = await fetch(`${API_URL}?${params.toString()}`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}: ${errorText}`);
                
                if (response.status === 401 || response.status === 403) {
                    console.log('   → Check if Google Pollen API is enabled in Google Cloud Console');
                    console.log('   → Verify API key permissions and restrictions');
                }
                continue;
            }
            
            const data = await response.json();
            
            console.log(`✅ Success for ${location.name}`);
            console.log(`   Region: ${data.regionCode || 'Unknown'}`);
            console.log(`   Days: ${data.dailyInfo?.length || 0}`);
            
            if (data.dailyInfo && data.dailyInfo.length > 0) {
                const firstDay = data.dailyInfo[0];
                console.log(`   First day date: ${firstDay.date}`);
                
                // Check for pollen types
                const pollenTypes = [];
                if (firstDay.pollenTypeInfo) {
                    firstDay.pollenTypeInfo.forEach(pollen => {
                        if (pollen.indexInfo) {
                            pollenTypes.push(`${pollen.code}: ${pollen.indexInfo.value}`);
                        }
                    });
                }
                
                if (pollenTypes.length > 0) {
                    console.log(`   Pollen levels: ${pollenTypes.join(', ')}`);
                } else {
                    console.log('   No pollen data available');
                }
            }
            
        } catch (error) {
            console.error(`❌ Network error for ${location.name}:`, error.message);
            
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.log('   → Check your internet connection');
            }
        }
    }
    
    console.log('\n🎉 API test completed!');
}

// Run the test
testPollenAPI().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});