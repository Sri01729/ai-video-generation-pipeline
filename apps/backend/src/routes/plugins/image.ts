import { Router } from 'express';
import { addVideoJob, getJob } from '../../queues/videoQueue';
import { validateRequest } from '../../middleware/validation';

const router = Router();

router.post('/generate', validateRequest, async (req, res) => {
  try {
    const { prompt, style, model } = req.body;

    // Add to video queue with image-only flag
    const job = await addVideoJob({
      prompt,
      style: style || 'realistic',
      model: model || 'gpt-4.1-nano',
      imageOnly: true // Flag to indicate this is an image-only generation
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Image generation job queued successfully'
    });
  } catch (err) {
    console.error('Error in image generation:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to queue image generation'
    });
  }
});

router.get('/result/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getJob(jobId);
    if (!job || !job.returnvalue?.imageBuffer) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const imageBuffer = Buffer.from(job.returnvalue.imageBuffer, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stream image' });
  }
});

export default router;