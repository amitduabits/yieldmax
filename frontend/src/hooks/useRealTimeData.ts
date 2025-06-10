import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useRealTimeData = () => {
  const [gasPrice, setGasPrice] = useState(0);
  
  const { data: yields } = useQuery({
    queryKey: ['yields'],
    queryFn: async () => {
      const response = await axios.get('/api/yields');
      return response.data;
    },
    refetchInterval: 30000
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await axios.get('/api/portfolio');
      return response.data;
    }
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await axios.get('/api/transactions');
      return response.data;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrice(Math.random() * 100 + 20);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    yields: yields || [],
    portfolio: portfolio || { positions: [], totalValue: 0, change24h: 0 },
    transactions: transactions || [],
    gasPrice,
    isConnected: true
  };
};
