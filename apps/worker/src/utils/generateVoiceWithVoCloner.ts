import 'dotenv/config';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('media.codecs');
chromium.use(stealth);

const userDataDir = '/tmp/playwright-user-data';

export default async function generateVoiceWithVoCloner(script: string, voicePath: string, voiceName: string) {
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    acceptDownloads: true,
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://vocloner.com/login.php');
    const loginButton = await page.$('xpath=/html/body/section/div/div/div/div[1]/div/div/a');
    if (loginButton) {
      await loginButton.click();
    console.log('clicked button');
    // Google login automation steps (commented out for brevity)
    console.log('Google login automation complete!');
    }


    const voiceXPath = `//body/section/div/div[h3[contains(., "${voiceName}")]]`;
    await page.click(`xpath=${voiceXPath}`);
    console.log(`Clicked voice element for: ${voiceName}`);

    await page.waitForSelector('xpath=//*[@id="text"]', { timeout: 20000 });
    await page.fill('xpath=//*[@id="text"]', script);
    console.log('Entered text in TTS field');

    await page.click('xpath=//*[@id="ttsForm"]/button');
    console.log('Clicked TTS submit button');

    await page.waitForSelector('xpath=//*[@id="downloadBtn"]', { timeout: 120000 });
    console.log('Download button appeared.');

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

// // Run the test
// (async () => {
//   const runDir = fs.readFileSync('run_dir.txt', 'utf8').trim();
//   const scriptPath = path.join(runDir, 'script');
//   // Find the script file in the script folder (pick the first .txt file)
//   const scriptFiles = fs.readdirSync(scriptPath).filter(f => f.endsWith('.txt'));
//   if (scriptFiles.length === 0) throw new Error('No script file found in script folder');
//   const script = fs.readFileSync(path.join(scriptPath, scriptFiles[0]), 'utf8');
//   const outPath = path.join(runDir, 'audio', 'voice-ultron.mp3');
//   console.log('Generating for voice: Ultron');
//   await generateVoiceWithVoCloner(script, outPath, 'Ultron');
// })();