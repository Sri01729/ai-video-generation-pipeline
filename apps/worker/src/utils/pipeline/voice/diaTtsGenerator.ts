import axios from 'axios';
import fs from 'fs/promises';

export type DiaTtsOptions = {
  text: string;
  outputPath: string;
  apiKey: string;
  seed?: number;
  top_p?: number;
  cfg_scale?: number;
  temperature?: number;
  input_audio?: string | null;
  speed_factor?: number;
  max_new_tokens?: number;
  cfg_filter_top_k?: number;
};

export async function generateDiaTts({
  text,
  outputPath,
  apiKey,
  seed = undefined,
  top_p = 0.95,
  cfg_scale = 4,
  temperature = 1.3,
  input_audio = null,
  speed_factor = 0.85,
  max_new_tokens = 3072,
  cfg_filter_top_k = 35,
}: DiaTtsOptions) {
  const url = 'https://api.segmind.com/v1/dia';
  const data: Record<string, any> = {
    text,
    top_p,
    cfg_scale,
    temperature,
    input_audio: input_audio ?? 'null',
    speed_factor,
    max_new_tokens,
    cfg_filter_top_k,
  };
  if (seed !== undefined) data.seed = seed;

  const headers = { 'x-api-key': apiKey };

  const response = await axios.post(url, data, {
    headers,
    responseType: 'arraybuffer',
  });

  if (response.status !== 200) {
    throw new Error(`DIA TTS failed: ${response.status} ${response.statusText}`);
  }

  await fs.writeFile(outputPath, response.data);
  return outputPath;
}