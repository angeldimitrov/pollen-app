import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    consoleLogs.push({
      timestamp,
      type: msg.type(),
      text: msg.text(),
      args: msg.args()
    });
    console.log(`[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('pollen.googleapis.com')) {
      console.log('\n🔗 GOOGLE POLLEN API REQUEST:');
      console.log('URL:', request.url());
      console.log('Method:', request.method());
      console.log('Headers:', request.headers());
    }
  });

  page.on('response', response => {
    if (response.url().includes('pollen.googleapis.com')) {
      console.log('\n📡 GOOGLE POLLEN API RESPONSE:');
      console.log('Status:', response.status());
      console.log('Headers:', response.headers());
    }
  });

  try {
    console.log('🚀 Navigating to pollen app...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    
    console.log('📍 Waiting for location and API data...');
    // Wait for location permission and API calls to complete
    await page.waitForTimeout(15000);
    
    console.log('\n📊 COMPLETE CONSOLE LOG SUMMARY:');
    console.log('='.repeat(80));
    
    consoleLogs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.text}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();