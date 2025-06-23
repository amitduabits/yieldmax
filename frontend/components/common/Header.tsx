import React from 'react';
import styled from 'styled-components';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useRouter } from 'next/router';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #1e293b;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  
  span {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a<{ active?: boolean }>`
  color: ${({ active }) => active ? '#3b82f6' : '#94a3b8'};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;
  
  &:hover {
    color: #3b82f6;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

export default function Header() {
  const router = useRouter();
  
  const isActive = (path: string) => router.pathname === path;
  
  return (
    <HeaderContainer>
      <Link href="/" passHref>
        <Logo>
          ⚡ <span>YieldMax</span>
        </Logo>
      </Link>
      
      <Nav>
        <Link href="/" passHref>
          <NavLink active={isActive('/')}>Portfolio</NavLink>
        </Link>
        <Link href="/strategies" passHref>
          <NavLink active={isActive('/strategies')}>Strategies</NavLink>
        </Link>
        <Link href="/bridge" passHref>
          <NavLink active={isActive('/bridge')}>Bridge</NavLink>
        </Link>
      </Nav>
      
      <ConnectButton />
      
      <MobileMenuButton>☰</MobileMenuButton>
    </HeaderContainer>
  );
}