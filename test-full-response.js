import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let fullApiResponse = null;
  
  // Capture the full API response
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📥 RAW GOOGLE API RESPONSE BODY:')) {
      // Extract JSON from the console message
      try {
        const jsonStart = text.indexOf('{');
        if (jsonStart !== -1) {
          const jsonString = text.substring(jsonStart);
          fullApiResponse = JSON.parse(jsonString);
          console.log('✅ CAPTURED FULL API RESPONSE');
        }
      } catch (e) {
        console.log('❌ Failed to parse JSON response:', e.message);
      }
    }
  });

  try {
    console.log('🚀 Loading pollen app to capture full API response...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    
    // Wait for API call to complete
    await page.waitForTimeout(10000);
    
    if (fullApiResponse) {
      console.log('\n📊 COMPLETE RAW GOOGLE POLLEN API RESPONSE:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(fullApiResponse, null, 2));
      
      console.log('\n🔍 RESPONSE ANALYSIS:');
      console.log('='.repeat(50));
      console.log(`Region Code: ${fullApiResponse.regionCode}`);
      console.log(`Days of data: ${fullApiResponse.dailyInfo?.length}`);
      console.log(`First day: ${fullApiResponse.dailyInfo?.[0]?.date?.year}-${fullApiResponse.dailyInfo?.[0]?.date?.month}-${fullApiResponse.dailyInfo?.[0]?.date?.day}`);
      
      if (fullApiResponse.dailyInfo?.[0]?.pollenTypeInfo) {
        console.log('\nPollen types for today:');
        fullApiResponse.dailyInfo[0].pollenTypeInfo.forEach(pollen => {
          console.log(`  - ${pollen.displayName} (${pollen.code}): ${pollen.indexInfo?.value || 'No data'} (${pollen.indexInfo?.category || 'No data'})`);
        });
      }
      
      if (fullApiResponse.dailyInfo?.[0]?.plantInfo) {
        console.log('\nPlant information available:');
        fullApiResponse.dailyInfo[0].plantInfo
          .filter(plant => plant.inSeason)
          .forEach(plant => {
            console.log(`  - ${plant.displayName} (${plant.code}): ${plant.indexInfo?.value || 'No data'} (${plant.indexInfo?.category || 'No data'})`);
          });
      }
    } else {
      console.log('❌ No API response captured');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();