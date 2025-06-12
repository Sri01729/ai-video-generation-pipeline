import { Router } from 'express';
import { addVideoJob } from '../../queues/videoQueue';
import { validateRequest } from '../../middleware/validation';

const router = Router();

router.post('/generate', validateRequest, async (req, res) => {
  try {
    const { script, voice, model } = req.body;

    // Add to video queue with voice-only flag
    const job = await addVideoJob({
      script,
      voice: voice || 'sage',
      model: model || 'tts-1',
      voiceOnly: true // Flag to indicate this is a voice-only generation
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Voice generation job queued successfully'
    });
  } catch (err) {
    console.error('Error in voice generation:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to queue voice generation'
    });
  }
});

export default router;