const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing frontend package.json...\n');

// Create fresh frontend package.json
const frontendPackage = {
  "name": "yieldmax-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "styled-components": "^6.1.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.9.0",
    "lucide-react": "^0.292.0",
    "ethers": "^5.7.2",
    "wagmi": "^1.4.0",
    "viem": "^1.19.0",
    "@rainbow-me/rainbowkit": "^1.3.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "@types/styled-components": "^5.1.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
};

// Write the file
fs.writeFileSync(
  path.join('frontend', 'package.json'), 
  JSON.stringify(frontendPackage, null, 2)
);

console.log('✅ Fixed frontend/package.json');

// Also create/update next.config.js to be safe
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
}

module.exports = nextConfig
`;

fs.writeFileSync(path.join('frontend', 'next.config.js'), nextConfig);
console.log('✅ Updated next.config.js');

// Create globals.css if missing
const globalsPath = path.join('frontend', 'src', 'app', 'globals.css');
if (!fs.existsSync(globalsPath)) {
  const globalsCss = `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #09090B;
  color: #FAFAFA;
}

a {
  color: inherit;
  text-decoration: none;
}`;
  
  fs.writeFileSync(globalsPath, globalsCss);
  console.log('✅ Created globals.css');
}

// Fix the layout import
const layoutPath = path.join('frontend', 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Remove the styled-components registry for now to simplify
  layoutContent = layoutContent.replace("import StyledComponentsRegistry from './registry';", "");
  layoutContent = layoutContent.replace("<StyledComponentsRegistry>", "<>");
  layoutContent = layoutContent.replace("</StyledComponentsRegistry>", "</>");
  
  // Add globals import if missing
  if (!layoutContent.includes('globals.css')) {
    layoutContent = `import './globals.css';\n${layoutContent}`;
  }
  
  fs.writeFileSync(layoutPath, layoutContent);
  console.log('✅ Simplified layout.tsx');
}

console.log('\n✅ All fixes applied!');
console.log('\nNow run these commands:');
console.log('1. cd frontend');
console.log('2. npm install');
console.log('3. npm run dev');