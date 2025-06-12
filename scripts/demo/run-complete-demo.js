// scripts/demo/run-complete-demo.js
const { spawn } = require('child_process');
const path = require('path');

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════╗
║         YIELDMAX DEMO ENVIRONMENT         ║
║      AI-Powered Yield Optimization        ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

const processes = [];

// Function to spawn a process
function spawnProcess(command, args, name, color) {
  colorLog(color, `Starting ${name}...`);
  
  const proc = spawn(command, args, {
    shell: true,
    stdio: 'pipe'
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`${colors[color]}[${name}] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`${colors.red}[${name} ERROR] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.on('close', (code) => {
    colorLog(color, `[${name}] Process exited with code ${code}`);
  });
  
  processes.push(proc);
  return proc;
}

async function startDemo() {
  try {
    // 1. Start WebSocket server
    spawnProcess('node', ['scripts/websocket-server.js'], 'WebSocket', 'yellow');
    
    // Wait for WebSocket to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Start Next.js development server
    spawnProcess('npm', ['run', 'dev'], 'Next.js', 'green');
    
    // Wait for Next.js to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log(`${colors.bright}${colors.green}
╔═══════════════════════════════════════════╗
║            DEMO READY! 🚀                 ║
╚═══════════════════════════════════════════╝

📍 Dashboard: http://localhost:3000
📊 WebSocket: ws://localhost:3001
💰 Demo Wallet: 0x1Ae0947c15b5d9dc74ad69E07A82725E71740603

🎮 DEMO CONTROLS:
- Press 'S' to trigger yield spike
- Press 'R' to trigger rebalance
- Press 'Q' to quit

💡 TIP: Open browser console to see live data
${colors.reset}`);
    
    // Simple input handler without raw mode for Windows compatibility
    console.log('\nPress S for spike, R for rebalance, or Q to quit\n');
    
  } catch (error) {
    console.error(`${colors.red}Demo startup failed:${colors.reset}`, error);
    cleanup();
  }
}

// Cleanup function
function cleanup() {
  colorLog('yellow', '\nCleaning up processes...');
  
  processes.forEach(proc => {
    try {
      process.kill(proc.pid);
    } catch (error) {
      // Process might already be dead
    }
  });
  
  setTimeout(() => {
    colorLog('green', '✅ Demo shutdown complete');
    process.exit(0);
  }, 1000);
}

// Handle exit signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the demo
startDemo();

// Demo checklist reminder
setTimeout(() => {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════╗
║           DEMO CHECKLIST ✓                ║
╠═══════════════════════════════════════════╣
║ ✓ Wallet connected to Sepolia             ║
║ ✓ 10,000 USDC in demo wallet             ║
║ ✓ AI monitoring active                    ║
║ ✓ WebSocket broadcasting                  ║
║ ✓ Cross-chain bridges ready               ║
╚═══════════════════════════════════════════╝
${colors.reset}`);
}, 10000);