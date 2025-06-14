import { Router } from 'express';
import { addVideoJob, getJob } from '../../queues/videoQueue';
import { validateRequest } from '../../middleware/validation';
import path from 'path';
import fs from 'fs';

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

router.get('/audio/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    // Find the job and get the audio path (you may need to adjust this logic)
    const job = await getJob(jobId);
    if (!job || !job.returnvalue?.output) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    const audioPath = job.returnvalue.output;
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file does not exist' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(audioPath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

export default router;