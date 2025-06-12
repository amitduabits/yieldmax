// scripts/websocket-server.js
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const MOCK_PROTOCOLS = [
  { name: 'Aave V3', chain: 'Arbitrum', baseApy: 8.2 },
  { name: 'GMX', chain: 'Arbitrum', baseApy: 15.7 },
  { name: 'Compound', chain: 'Ethereum', baseApy: 6.8 },
  { name: 'Curve', chain: 'Polygon', baseApy: 11.3 },
  { name: 'Yearn', chain: 'Ethereum', baseApy: 12.5 }
];

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ New client connected');
  clients.add(ws);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'CONNECTION',
    message: 'Connected to YieldMax Live Feed'
  }));
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast yield updates every 5 seconds
setInterval(() => {
  const protocol = MOCK_PROTOCOLS[Math.floor(Math.random() * MOCK_PROTOCOLS.length)];
  const change = (Math.random() - 0.5) * 2; // -1% to +1%
  
  const update = {
    type: 'YIELD_UPDATE',
    payload: {
      protocol: protocol.name,
      chain: protocol.chain,
      apy: protocol.baseApy + change,
      tvl: Math.floor(Math.random() * 1000000000) + 100000000,
      change: change,
      timestamp: Date.now()
    }
  };
  
  broadcast(update);
}, 5000);

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log('🌐 WebSocket server running on ws://localhost:' + PORT);
  console.log('📡 Broadcasting live yield updates...');
  console.log('Press Ctrl+C to stop\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WebSocket server...');
  clients.forEach(client => client.close());
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});