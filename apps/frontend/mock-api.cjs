const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/generate', (req, res) => {
  res.json({
    success: true,
    output: 'results/fake-video.mp4'
  });
});

app.listen(5001, () => {
  console.log('Mock API running on http://localhost:5001');
});