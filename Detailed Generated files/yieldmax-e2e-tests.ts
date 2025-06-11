// ==================== YIELDMAX FRONTEND E2E TESTS ====================

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { MetaMask } from '@chainsafe/dappeteer';

// ==================== E2E TEST CONFIGURATION ====================

const TEST_TIMEOUT = 300000; // 5 minutes for cross-chain operations

test.describe.configure({ 
  mode: 'parallel',
  timeout: TEST_TIMEOUT 
});

// Test wallet configuration
const TEST_WALLET = {
  mnemonic: process.env.TEST_MNEMONIC || 'test test test test test test test test test test test junk',
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
};

// ==================== WALLET CONNECTION TESTS ====================

test.describe('Wallet Connection', () => {
  let context: BrowserContext;
  let page: Page;
  let metamask: MetaMask;

  test.beforeEach(async ({ browser }) => {
    // Setup MetaMask
    const metamaskPath = await setupMetaMask();
    context = await browser.newContext({
      args: [`--disable-extensions-except=${metamaskPath}`],
    });
    
    page = await context.newPage();
    metamask = await getMetaMask(context);
    
    // Import test wallet
    await metamask.importWallet(TEST_WALLET.mnemonic);
    
    // Navigate to app
    await page.goto('http://localhost:3000');
  });

  test('should connect MetaMask wallet', async () => {
    // Click connect button
    await page.click('[data-testid="connect-wallet-button"]');
    
    // Select MetaMask
    await page.click('[data-testid="wallet-option-metamask"]');
    
    // Handle MetaMask popup
    await metamask.approve();
    
    // Verify connection
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText('0xf39F...2266');
    await expect(page.locator('[data-testid="wallet-balance"]')).toBeVisible();
  });

  test('should switch networks correctly', async () => {
    // Connect wallet first
    await connectWallet(page, metamask);
    
    // Open network selector
    await page.click('[data-testid="network-selector"]');
    
    // Switch to Arbitrum
    await page.click('[data-testid="network-option-arbitrum"]');
    
    // Approve network switch in MetaMask
    await metamask.acceptNetworkSwitch();
    
    // Verify network changed
    await expect(page.locator('[data-testid="current-network"]')).toContainText('Arbitrum');
  });

  test('should handle wallet disconnect', async () => {
    await connectWallet(page, metamask);
    
    // Click account menu
    await page.click('[data-testid="account-menu"]');
    
    // Click disconnect
    await page.click('[data-testid="disconnect-wallet"]');
    
    // Verify disconnection
    await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="wallet-address"]')).not.toBeVisible();
  });
});

// ==================== DEPOSIT FLOW TESTS ====================

test.describe('Deposit Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupConnectedWallet(page);
  });

  test('should complete deposit successfully', async ({ page }) => {
    // Navigate to deposit
    await page.click('[data-testid="deposit-button"]');
    
    // Select protocol
    await page.click('[data-testid="protocol-selector"]');
    await page.click('[data-testid="protocol-aave"]');
    
    // Enter amount
    await page.fill('[data-testid="deposit-amount-input"]', '1000');
    
    // Verify gas estimation
    await expect(page.locator('[data-testid="gas-estimate"]')).toContainText('$');
    
    // Click deposit
    await page.click('[data-testid="confirm-deposit-button"]');
    
    // Handle token approval
    const approvalPopup = await page.waitForEvent('popup');
    await approvalPopup.click('button:has-text("Confirm")');
    
    // Handle deposit transaction
    const depositPopup = await page.waitForEvent('popup');
    await depositPopup.click('button:has-text("Confirm")');
    
    // Wait for transaction confirmation
    await expect(page.locator('[data-testid="transaction-status"]')).toContainText('Confirmed', {
      timeout: 60000
    });
    
    // Verify position appears
    await expect(page.locator('[data-testid="position-aave"]')).toBeVisible();
  });

  test('should validate deposit inputs', async ({ page }) => {
    await page.click('[data-testid="deposit-button"]');
    
    // Test zero amount
    await page.fill('[data-testid="deposit-amount-input"]', '0');
    await expect(page.locator('[data-testid="deposit-error"]')).toContainText('Amount must be greater than 0');
    
    // Test exceeding balance
    await page.fill('[data-testid="deposit-amount-input"]', '1000000');
    await expect(page.locator('[data-testid="deposit-error"]')).toContainText('Insufficient balance');
    
    // Test minimum amount
    await page.fill('[data-testid="deposit-amount-input"]', '0.01');
    await expect(page.locator('[data-testid="deposit-warning"]')).toContainText('Amount below minimum');
  });

  test('should show accurate APY and projected earnings', async ({ page }) => {
    await page.click('[data-testid="deposit-button"]');
    await page.click('[data-testid="protocol-selector"]');
    await page.click('[data-testid="protocol-compound"]');
    
    await page.fill('[data-testid="deposit-amount-input"]', '5000');
    
    // Verify APY display
    await expect(page.locator('[data-testid="current-apy"]')).toContainText('%');
    
    // Verify projected earnings
    await expect(page.locator('[data-testid="daily-earnings"]')).toContainText('$');
    await expect(page.locator('[data-testid="annual-earnings"]')).toContainText('$');
  });
});

// ==================== CROSS-CHAIN OPERATIONS TESTS ====================

test.describe('Cross-Chain Operations', () => {
  test('should execute cross-chain rebalance', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Navigate to optimization
    await page.click('[data-testid="optimize-tab"]');
    
    // Select cross-chain opportunity
    await page.click('[data-testid="opportunity-cross-chain-arbitrage"]');
    
    // Verify details
    await expect(page.locator('[data-testid="from-chain"]')).toContainText('Ethereum');
    await expect(page.locator('[data-testid="to-chain"]')).toContainText('Arbitrum');
    await expect(page.locator('[data-testid="profit-estimate"]')).toContainText('+');
    
    // Execute rebalance
    await page.click('[data-testid="execute-rebalance"]');
    
    // Track cross-chain message
    await expect(page.locator('[data-testid="ccip-status"]')).toContainText('Sending', {
      timeout: 10000
    });
    
    await expect(page.locator('[data-testid="ccip-status"]')).toContainText('Delivered', {
      timeout: TEST_TIMEOUT
    });
    
    // Verify position updated on destination chain
    await page.click('[data-testid="network-selector"]');
    await page.click('[data-testid="network-option-arbitrum"]');
    
    await expect(page.locator('[data-testid="position-updated"]')).toBeVisible();
  });

  test('should track cross-chain transaction status', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Initiate cross-chain transfer
    await initiateCrossChainTransfer(page, 'Polygon', 'Optimism', '2000');
    
    // Verify status tracking
    const statusTracker = page.locator('[data-testid="transaction-tracker"]');
    
    // Stage 1: Withdrawal from source
    await expect(statusTracker).toContainText('Withdrawing from Polygon');
    await expect(statusTracker.locator('[data-testid="stage-1-status"]')).toHaveClass(/in-progress/);
    
    // Stage 2: Cross-chain message
    await expect(statusTracker).toContainText('Sending cross-chain message', {
      timeout: 60000
    });
    await expect(statusTracker.locator('[data-testid="stage-2-status"]')).toHaveClass(/in-progress/);
    
    // Stage 3: Deposit on destination
    await expect(statusTracker).toContainText('Depositing to Optimism', {
      timeout: 180000
    });
    await expect(statusTracker.locator('[data-testid="stage-3-status"]')).toHaveClass(/completed/, {
      timeout: TEST_TIMEOUT
    });
  });
});

// ==================== PERFORMANCE TESTS ====================

test.describe('Performance', () => {
  test('should load dashboard within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    
    // Verify critical content visible
    await expect(page.locator('[data-testid="portfolio-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="yield-comparison"]')).toBeVisible();
  });

  test('should handle real-time updates efficiently', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Measure initial memory
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory;
    });
    
    // Subscribe to real-time updates
    await page.evaluate(() => {
      window.yieldMaxSocket.connect();
    });
    
    // Wait for updates
    await page.waitForTimeout(30000); // 30 seconds of updates
    
    // Measure memory after updates
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory;
    });
    
    // Verify no significant memory leak
    const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    
    // Verify UI remains responsive
    const interactionStart = Date.now();
    await page.click('[data-testid="refresh-data"]');
    const interactionTime = Date.now() - interactionStart;
    
    expect(interactionTime).toBeLessThan(100); // Interaction under 100ms
  });

  test('should render large portfolio efficiently', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Mock large portfolio
    await page.evaluate(() => {
      window.mockLargePortfolio(100); // 100 positions
    });
    
    // Navigate to portfolio
    const startTime = Date.now();
    await page.click('[data-testid="portfolio-tab"]');
    
    // Wait for render
    await page.waitForSelector('[data-testid="position-item"]:nth-child(100)');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000); // Render under 2 seconds
    
    // Test scroll performance
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="portfolio-list"]');
      container?.scrollTo(0, container.scrollHeight);
    });
    
    // Verify virtualization working
    const visibleItems = await page.locator('[data-testid="position-item"]').count();
    expect(visibleItems).toBeLessThan(30); // Only visible items rendered
  });
});

// ==================== MOBILE RESPONSIVENESS TESTS ====================

test.describe('Mobile Experience', () => {
  test.use({
    viewport: { width: 375, height: 812 }, // iPhone X
  });

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();
    
    // Test touch interactions
    await page.locator('[data-testid="portfolio-card"]').swipe({
      direction: 'left',
      distance: 100
    });
    
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should handle mobile wallet connection', async ({ page }) => {
    // Click connect
    await page.click('[data-testid="mobile-connect-wallet"]');
    
    // Select WalletConnect
    await page.click('[data-testid="wallet-option-walletconnect"]');
    
    // Verify QR code displayed
    await expect(page.locator('[data-testid="walletconnect-qr"]')).toBeVisible();
    
    // Simulate mobile wallet connection
    await page.evaluate(() => {
      window.simulateMobileWalletConnection();
    });
    
    // Verify connected
    await expect(page.locator('[data-testid="mobile-wallet-address"]')).toBeVisible();
  });
});

// ==================== ERROR HANDLING TESTS ====================

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Simulate network error
    await page.route('**/api/**', route => route.abort());
    
    // Try to load data
    await page.reload();
    
    // Verify error state
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load data');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Fix network and retry
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    
    // Verify recovery
    await expect(page.locator('[data-testid="portfolio-value"]')).toBeVisible();
  });

  test('should handle transaction failures', async ({ page }) => {
    await setupConnectedWallet(page);
    
    // Mock transaction failure
    await page.evaluate(() => {
      window.mockTransactionFailure = true;
    });
    
    // Attempt deposit
    await page.click('[data-testid="deposit-button"]');
    await page.fill('[data-testid="deposit-amount-input"]', '1000');
    await page.click('[data-testid="confirm-deposit-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="transaction-error"]')).toContainText('Transaction failed');
    await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
    
    // Verify can retry
    await expect(page.locator('[data-testid="retry-transaction"]')).toBeVisible();
  });
});

// ==================== HELPER FUNCTIONS ====================

async function setupMetaMask(): Promise<string> {
  // Setup MetaMask extension for testing
  // Returns path to MetaMask extension
  return '/path/to/metamask';
}

async function getMetaMask(context: BrowserContext): Promise<MetaMask> {
  // Get MetaMask instance from context
  // Implementation depends on dappeteer setup
  return {} as MetaMask;
}

async function connectWallet(page: Page, metamask: MetaMask): Promise<void> {
  await page.click('[data-testid="connect-wallet-button"]');
  await page.click('[data-testid="wallet-option-metamask"]');
  await metamask.approve();
  await page.waitForSelector('[data-testid="wallet-address"]');
}

async function setupConnectedWallet(page: Page): Promise<void> {
  // Mock connected wallet for faster testing
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    window.mockWalletConnection({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chainId: 1,
      balance: '10000000000000000000' // 10 ETH
    });
  });
}

async function initiateCrossChainTransfer(
  page: Page,
  fromChain: string,
  toChain: string,
  amount: string
): Promise<void> {
  await page.click('[data-testid="transfer-button"]');
  await page.selectOption('[data-testid="from-chain-select"]', fromChain);
  await page.selectOption('[data-testid="to-chain-select"]', toChain);
  await page.fill('[data-testid="transfer-amount"]', amount);
  await page.click('[data-testid="execute-transfer"]');
}

// ==================== PERFORMANCE MONITORING ====================

test.describe('Performance Metrics', () => {
  test('should track Core Web Vitals', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for page to stabilize
    await page.waitForTimeout(5000);
    
    // Get Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {
            LCP: 0,
            FID: 0,
            CLS: 0
          };
          
          entries.forEach((entry: any) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.renderTime || entry.loadTime;
            }
            if (entry.name === 'first-input') {
              vitals.FID = entry.processingStart - entry.startTime;
            }
            if (entry.name === 'layout-shift') {
              vitals.CLS += entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });
    
    // Verify metrics meet targets
    expect(metrics.LCP).toBeLessThan(2500); // LCP under 2.5s
    expect(metrics.FID).toBeLessThan(100);  // FID under 100ms
    expect(metrics.CLS).toBeLessThan(0.1);  // CLS under 0.1
  });
});