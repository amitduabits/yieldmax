import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

const StyledToastContainer = styled(ToastContainer)`
  .Toastify__toast {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
  }
  
  .Toastify__toast--success {
    border-color: rgba(16, 185, 129, 0.5);
  }
  
  .Toastify__toast--error {
    border-color: rgba(239, 68, 68, 0.5);
  }
  
  .Toastify__toast--warning {
    border-color: rgba(251, 146, 60, 0.5);
  }
  
  .Toastify__progress-bar {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  }
`;

export default function Toast() {
  return (
    <StyledToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  );
}