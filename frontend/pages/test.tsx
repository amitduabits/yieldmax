import { useState, useEffect } from 'react';

export default function Test() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a', 
      color: 'white',
      padding: '2rem'
    }}>
      <h1>YieldMax Test Page</h1>
      <p>If you can see this without errors, the basic setup works!</p>
    </div>
  );
}