import dotenv from 'dotenv';
dotenv.config();
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('media.codecs');
chromium.use(stealth);

const userDataDir = '/tmp/playwright-user-data';

async function testVoClonerGoogleLoginFull() {
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    acceptDownloads: true,
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://vocloner.com/login.php');
    await page.click('xpath=/html/body/section/div/div/div/div[1]/div/div/a');
    console.log('clicked button');
    // Wait for Google email field in the same tab
    // await page.waitForSelector('input[type="email"]', { timeout: 50000 });
    // await page.fill('input[type="email"]', process.env.GOOGLE_EMAIL!);
    // await page.click('button:has-text("Next")');
    // await page.waitForTimeout(1000); // Wait for password field
    // await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    // await page.fill('input[type="password"]', process.env.GOOGLE_PASSWORD!);
    // await page.click('button:has-text("Next")');
    // // Wait for redirect or next step
    // await page.waitForTimeout(5000);
    console.log('Google login automation complete!');

    // Click the element at /html/body/section/div/div[2]
    await page.click('xpath=/html/body/section/div/div[2]');
    console.log('Clicked Thanos voice element');

    // Enter text in the field with id 'text'
    await page.waitForSelector('xpath=//*[@id="text"]', { timeout: 20000 });
    await page.fill('xpath=//*[@id="text"]', `The universe... is finite... its resources, finite...

And yet... developers continue to build... more and more...

Chaos... inefficiency... threads everywhere...

Until... I found it...

Node.js...

A single-threaded... non-blocking... event-driven system...

Simple... yet powerful...

While others rely on threads to scale...
Node... uses a loop...

An event loop...

It listens... it waits... it reacts...

Like a patient predator... it never wastes effort...`);

    console.log('Entered text in TTS field');

    // Click the button at //*[@id="ttsForm"]/button
    await page.click('xpath=//*[@id="ttsForm"]/button');
    console.log('Clicked TTS submit button');

    // Wait for 1 minute
    await page.waitForTimeout(20000);
    console.log('Done waiting 1 minute after TTS submit.');

    // Click the download button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('xpath=//*[@id="downloadBtn"]'),
    ]);

    const savePath = `/Users/srinualahari/Documents/Projects/AI-Video-generation/ai-video-generation-pipeline/public/audiofiles/thanos-${Date.now()}.mp3`;
    await download.saveAs(savePath);
    console.log('Downloaded to:', savePath);

    await browser.close();
  } catch (err) {
    console.error('Google login automation failed:', err);
    await browser.close();
    process.exit(1);
  }
}

// Run the test
(async () => {
  console.log('GOOGLE_EMAIL:', process.env.GOOGLE_EMAIL);
  console.log('GOOGLE_PASSWORD:', process.env.GOOGLE_PASSWORD);
  await testVoClonerGoogleLoginFull();
})();