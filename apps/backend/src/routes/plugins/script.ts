import { Router } from 'express';
import { addVideoJob, getJob } from '../../queues/videoQueue';
import { validateRequest } from '../../middleware/validation';

const router = Router();

router.post('/generate', validateRequest, async (req, res) => {
  try {
    const { prompt, persona, style, maxLength, model, provider, promptStyle } = req.body;

    // Add to video queue with script-only flag
    const job = await addVideoJob({
      prompt,
      persona: persona || 'funny, sharp-tongued tech explainer',
      style: style || 'memes, sarcasm, relatable developer humor',
      maxLength: maxLength || 700,
      model: model || 'gpt-4.1-nano',
      provider: provider || 'openai',
      promptStyle: promptStyle || 'dev-meme',
      scriptOnly: true // Flag to indicate this is a script-only generation
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Script generation job queued successfully'
    });
  } catch (err) {
    console.error('Error in script generation:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to queue script generation'
    });
  }
});

// Add new endpoint to get script result
router.get('/result/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.failedReason) {
      return res.status(500).json({
        success: false,
        error: job.failedReason
      });
    }

    if (job.returnvalue?.script) {
      return res.json({
        success: true,
        script: job.returnvalue.script
      });
    }

    // If job is still processing
    return res.json({
      success: true,
      status: 'processing'
    });
  } catch (err) {
    console.error('Error getting script result:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get script result'
    });
  }
});

export default router;