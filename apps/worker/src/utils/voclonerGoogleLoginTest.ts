import 'dotenv/config';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('media.codecs');
chromium.use(stealth);

const userDataDir = '/tmp/playwright-user-data';

export default async function generateVoice(script: string, voicePath: string) {
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

    await page.click('xpath=/html/body/section/div/div[2]');
    console.log('Clicked Thanos voice element');

    await page.waitForSelector('xpath=//*[@id="text"]', { timeout: 20000 });
    await page.fill('xpath=//*[@id="text"]', script);
    console.log('Entered text in TTS field');

     // Click the button at //*[@id="ttsForm"]/button
    await page.click('xpath=//*[@id="ttsForm"]/button');
    console.log('Clicked TTS submit button');

    await page.waitForTimeout(60000);
    console.log('Done waiting 1 minute after TTS submit.');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('xpath=//*[@id="downloadBtn"]'),
    ]);

    await download.saveAs(voicePath);
    console.log('Downloaded to:', voicePath);

    await browser.close();
  } catch (err) {
    console.error('Google login automation failed:', err);
    await browser.close();
    process.exit(1);
  }
}

// Run the test
// (async () => {
//   console.log('GOOGLE_EMAIL:', process.env.GOOGLE_EMAIL);
//   console.log('GOOGLE_PASSWORD:', process.env.GOOGLE_PASSWORD);
//   await generateVoice('Hello, world!', 'public/audiofiles/test-voice.mp3');
// })();