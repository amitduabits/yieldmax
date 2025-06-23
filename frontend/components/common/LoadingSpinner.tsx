import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div<{ size?: string }>`
  border: 2px solid #1e293b;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  width: ${({ size }) => size || '24px'};
  height: ${({ size }) => size || '24px'};
  animation: ${spin} 1s linear infinite;
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

interface LoadingSpinnerProps {
  size?: string;
  centered?: boolean;
}

export default function LoadingSpinner({ size, centered = true }: LoadingSpinnerProps) {
  if (centered) {
    return (
      <Container>
        <Spinner size={size} />
      </Container>
    );
  }
  
  return <Spinner size={size} />;
}