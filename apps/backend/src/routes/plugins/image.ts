import { Router } from 'express';
import { addVideoJob } from '../../queues/videoQueue';
import { validateRequest } from '../../middleware/validation';

const router = Router();

router.post('/generate', validateRequest, async (req, res) => {
  try {
    const { script, style, model } = req.body;

    // Add to video queue with image-only flag
    const job = await addVideoJob({
      script,
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

export default router;