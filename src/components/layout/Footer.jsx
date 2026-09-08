import React from 'react';
import styled from 'styled-components';
import { Shield, ArrowRight, Lock, CheckCircle } from 'lucide-react';
import { PrimaryButton } from '../common/Button.jsx';

// Footer area with an elevated maroon Security Command Card on a continuous canvas
const FooterWrapper = styled.footer`
  background-color: ${(props) => props.theme.colors.white};
  padding: 40px 24px 48px;
  position: relative;
`;

const Container = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 48px;
  position: relative;
`;

// Elevated dark maroon security command card
const CtaCard = styled.div`
  width: 100%;
  background: radial-gradient(ellipse at 50% -20%, #3d0711 0%, #1f0408 65%, #150205 100%);
  color: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(200, 16, 46, 0.25);
  box-shadow: 0 24px 48px -12px rgba(31, 4, 8, 0.25), 0 4px 12px rgba(0, 0, 0, 0.04);
  padding: 64px 32px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
  position: relative;
  overflow: hidden;

  /* Subtle ambient center glow inside the card */
  &::before {
    content: '';
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 520px;
    height: 180px;
    background: radial-gradient(ellipse at 50% 50%, rgba(200, 16, 46, 0.35), transparent 70%);
    pointer-events: none;
  }
`;

const CtaContent = styled.div`
  max-width: 680px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  position: relative;
  z-index: 1;

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgba(200, 16, 46, 0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(200, 16, 46, 0.35);
  }

  h2 {
    font-size: clamp(28px, 3.8vw, 42px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: #ffffff;
  }

  p {
    font-size: 15.5px;
    color: #d4d0c8;
    line-height: 1.6;
  }
`;

const BadgesRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 32px;
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;

  div.badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #d4d0c8;
    font-weight: 500;

    svg {
      color: #10b981;
    }
  }
`;

const BottomLinksRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
  color: ${(props) => props.theme.colors.soft};

  div.brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
  }

  div.nav {
    display: flex;
    gap: 24px;

    a {
      color: ${(props) => props.theme.colors.soft};
      text-decoration: none;
      transition: color 0.15s ease;

      &:hover {
        color: ${(props) => props.theme.colors.ink};
      }
    }
  }
`;

/**
 * Strong Footer Component
 * Deep red / near-black final CTA area integrating seamlessly into the footer links.
 */
export default function Footer({ onOpenAuth }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <FooterWrapper id="footer">
      <Container>
        {/* Elevated Maroon Security Command Card */}
        <CtaCard>
          <CtaContent>
            <div className="icon-wrapper">
              <Shield size={22} color="#fca5a5" />
            </div>
            <h2>Ready to safeguard your exam repository?</h2>
            <p>
              Setup takes under 2 minutes. Protect files against scraping scripts and unauthorized off-campus downloads.
            </p>
            <PrimaryButton onClick={onOpenAuth} style={{ marginTop: '4px' }}>
              Open Secure Portal <ArrowRight size={16} />
            </PrimaryButton>
          </CtaContent>

          {/* Real implemented capabilities */}
          <BadgesRow>
            <div className="badge">
              <CheckCircle size={15} />
              <span>RFC 6238 Authenticator App Support</span>
            </div>
            <div className="badge">
              <CheckCircle size={15} />
              <span>Email One-Time Passcode (OTP)</span>
            </div>
            <div className="badge">
              <CheckCircle size={15} />
              <span>Anomaly Risk Scoring & Access Logs</span>
            </div>
          </BadgesRow>
        </CtaCard>

        {/* Bottom copyright and quick links */}
        <BottomLinksRow>
          <div className="brand">
            <Shield size={16} color="#c8102e" />
            <span>Faculty Guard &bull; Security & Access Verification</span>
          </div>

          <div className="nav">
            <a href="#features" onClick={() => scrollToSection('features')}>
              Features
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth(); }}>
              Sign In
            </a>
            <a href="#hero" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to Top
            </a>
          </div>

          <div>&copy; {new Date().getFullYear()} Faculty Guard.</div>
        </BottomLinksRow>
      </Container>
    </FooterWrapper>
  );
}
