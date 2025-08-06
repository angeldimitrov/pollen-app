import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: msg.type(),
      text: msg.text(),
      args: msg.args()
    };
    logs.push(logEntry);
    console.log(`[${timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Capture network requests
  const requests = [];
  page.on('request', request => {
    const timestamp = new Date().toISOString();
    if (request.url().includes('pollen') || request.url().includes('google')) {
      requests.push({
        timestamp,
        url: request.url(),
        method: request.method()
      });
      console.log(`[${timestamp}] REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  try {
    // Navigate to the app
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait and observe for 15 seconds to capture the pattern
    console.log('Waiting 15 seconds to observe console logs and API calls...');
    await page.waitForTimeout(15000);
    
    // Save logs to file
    const logData = {
      consoleLogs: logs,
      networkRequests: requests,
      summary: {
        totalConsoleLogs: logs.length,
        totalAPIRequests: requests.length,
        pollenAPIRequests: requests.filter(r => r.url.includes('pollen')).length
      }
    };
    
    fs.writeFileSync('console-analysis.json', JSON.stringify(logData, null, 2));
    console.log('\nAnalysis Summary:');
    console.log(`Total console logs: ${logData.summary.totalConsoleLogs}`);
    console.log(`Total API requests: ${logData.summary.totalAPIRequests}`);
    console.log(`Pollen API requests: ${logData.summary.pollenAPIRequests}`);
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for manual inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(60000); // Keep open for 1 minute
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();