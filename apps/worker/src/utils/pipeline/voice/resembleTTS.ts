import axios from 'axios';
import fs from 'fs';

const API_KEY = process.env.RESEMBLE_API_KEY!;
const PROJECT_UUID = process.env.RESEMBLE_PROJECT_UUID!;
const VOICE_UUID = process.env.RESEMBLE_VOICE_UUID!;

export async function resembleTTS(text: string, outPath: string = 'output.wav'): Promise<string> {
  if (!API_KEY || !PROJECT_UUID || !VOICE_UUID) {
    throw new Error('Missing Resemble API credentials in environment variables');
  }
  let clipId: string;
  try {
    const response = await axios.post(
      `https://app.resemble.ai/api/v2/projects/${PROJECT_UUID}/clips`,
      {
        title: 'Node TTS',
        body: text,
        voice_uuid: VOICE_UUID,
        is_public: false,
        sample_rate: 44100
      },
      {
        headers: {
          'Authorization': `Token token=${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    clipId = response.data.item.uuid;
  } catch (err) {
    console.error('Error creating TTS clip:', err);
    throw err;
  }

  // Poll for audio
  let audioUrl: string | undefined;
  for (let i = 0; i < 20; i++) {
    try {
      const clipResp = await axios.get(
        `https://app.resemble.ai/api/v2/projects/${PROJECT_UUID}/clips/${clipId}`,
        { headers: { 'Authorization': `Token token=${API_KEY}` } }
      );
      if (clipResp.data.item && clipResp.data.item.audio_src) {
        audioUrl = clipResp.data.item.audio_src;
        break;
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
    await new Promise(res => setTimeout(res, 3000));
  }
  if (!audioUrl) throw new Error('TTS audio not ready after polling');

  // Download audio
  try {
    const audioResp = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outPath, audioResp.data);
    return outPath;
  } catch (err) {
    console.error('Error downloading audio:', err);
    throw err;
  }
}

// Example usage (uncomment to test directly):
// (async () => {
//   try {
//     const out = await resembleTTS('Hello from Resemble AI!', 'output.wav');
//     console.log('Audio saved to', out);
//   } catch (err) {
//     console.error(err);
//   }
// })();