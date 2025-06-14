import { getVoiceInstructions } from './voiceStyles';

/**
 * Handler for OpenAI function calling: get_voice_instructions
 * @param style - The style key (e.g., 'dramatic', 'cowboy', etc.)
 * @returns { instructions: string }
 */
export function getVoiceInstructionsHandler({ style }: { style: string }): { instructions: string } {
  return { instructions: getVoiceInstructions(style) };
}