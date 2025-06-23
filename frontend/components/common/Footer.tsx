import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  border-top: 1px solid #1e293b;
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
`;

const Links = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
  
  a {
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: #3b82f6;
    }
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <Links>
        <a href="https://docs.yieldmax.fi" target="_blank" rel="noopener noreferrer">
          Docs
        </a>
        <a href="https://github.com/yieldmax" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="https://twitter.com/yieldmaxfi" target="_blank" rel="noopener noreferrer">
          Twitter
        </a>
        <a href="https://discord.gg/yieldmax" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
      </Links>
      <p>© 2024 YieldMax Protocol. All rights reserved.</p>
    </FooterContainer>
  );
}