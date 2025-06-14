import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4050 });
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (msg: string) => {
    try {
      const { type, jobId } = JSON.parse(msg);
      if (type === 'subscribe' && jobId) clients.set(jobId, ws);
    } catch {}
  });
  ws.on('close', () => {
    for (const [jobId, client] of clients.entries()) {
      if (client === ws) clients.delete(jobId);
    }
  });
});

export function emitProgress(jobId: string, step: string) {
  const ws = clients.get(jobId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ jobId, step }));
    if (step === 'done') clients.delete(jobId);
  }
}