import React from 'react';
import AIOptimization from '../components/AIOptimization/AIOptimization';
import { useAccount } from 'wagmi';

export default function StrategiesPage() {
  const { address } = useAccount();
  return <AIOptimization account={address} />;
}