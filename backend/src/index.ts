import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { attachWebSocketServer } from './wsServer';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = createApp();
const server = http.createServer(app);

attachWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`\n🏟  Bundesliga Backend`);
  console.log(`   REST  → http://localhost:${PORT}/api`);
  console.log(`   WS    → ws://localhost:${PORT}/live/:matchId`);
  console.log(`   Health→ http://localhost:${PORT}/health\n`);
});
