import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Lock, Terminal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { PrimaryButton, DangerButton, GhostButton } from '../common/Button.jsx';

// Section wrapper matching the clean institutional canvas
const SectionWrapper = styled.section`
  background-color: ${(props) => props.theme.colors.offWhite};
  padding: 88px 24px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const Container = styled.div`
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`;

const SectionHeader = styled.div`
  text-align: center;
  max-width: 640px;

  .eyebrow {
    font-size: 13px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.red};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  h2 {
    font-size: clamp(28px, 3.5vw, 38px);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: ${(props) => props.theme.colors.ink};
    line-height: 1.2;
  }

  p {
    font-size: 16px;
    color: ${(props) => props.theme.colors.soft};
    margin-top: 10px;
    line-height: 1.6;
  }
`;

// Main interactive alert card designed specifically for teachers
const AlertCard = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => (props.$resolved ? props.theme.colors.greenBorder : props.theme.colors.redMid)};
  border-radius: ${(props) => props.theme.radii.card};
  box-shadow: 0 12px 32px rgba(17, 17, 16, 0.05);
  overflow: hidden;
  transition: border-color 0.3s ease;
`;

// High-visibility status header (Amber/Red when pending, Green when resolved)
const CardBanner = styled.div`
  padding: 18px 24px;
  background-color: ${(props) => (props.$resolved ? props.theme.colors.greenLight : props.theme.colors.redLight)};
  border-bottom: 1px solid ${(props) => (props.$resolved ? props.theme.colors.greenBorder : props.theme.colors.redMid)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .status-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => (props.$resolved ? props.theme.colors.greenDark : props.theme.colors.red)};
  }

  .timestamp {
    font-family: ${(props) => props.theme.typography.monoFont};
    font-size: 12px;
    color: ${(props) => props.theme.colors.soft};
  }
`;

const CardBody = styled.div`
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  .question-heading {
    font-size: 20px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
    line-height: 1.4;
  }

  .plain-description {
    font-size: 15px;
    color: ${(props) => props.theme.colors.soft};
    line-height: 1.6;
  }
`;

// Action buttons allowing the teacher to respond without entering code
const DecisionRow = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

// Resolution notification banner
const ResolutionNotice = styled(motion.div)`
  padding: 16px 20px;
  border-radius: 8px;
  background-color: ${(props) => (props.$action === 'locked' ? props.theme.colors.redLight : props.theme.colors.greenLight)};
  border: 1px solid ${(props) => (props.$action === 'locked' ? props.theme.colors.redMid : props.theme.colors.greenBorder)};
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: ${(props) => (props.$action === 'locked' ? props.theme.colors.redDark : props.theme.colors.greenDark)};
`;

// Technical toggle link
const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.soft};
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;
  width: fit-content;
  transition: color 0.15s ease;

  &:hover {
    color: ${(props) => props.theme.colors.ink};
  }
`;

// Hidden technical telemetry drawer for forensic analysis
const TechnicalDrawer = styled(motion.div)`
  border-top: 1px solid ${(props) => props.theme.colors.border};
  background-color: #161615;
  color: #d4d0c8;
  padding: 24px 28px;
  font-family: ${(props) => props.theme.typography.monoFont};
  font-size: 12.5px;
  line-height: 1.8;

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .metric-item {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .label {
      color: #72716d;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      color: #ffffff;
      font-weight: 600;
    }

    .value.danger {
      color: #f87171;
    }
  }

  .log-line {
    padding-top: 12px;
    border-top: 1px solid #292926;
    color: #9ca3af;
    font-size: 12px;
  }
`;

/**
 * Human-First Incident Walkthrough Component
 * Explains security events in plain English ("Was this you?") with 1-click actions
 * and an expandable JetBrains Mono terminal drawer for technical forensic details.
 */
export default function IncidentWalkthrough({ onOpenAuth }) {
  // Decision state: null = pending, 'locked' = kept locked, 'unlocked' = educator unlocked
  const [resolution, setResolution] = useState(null);
  // Controls visibility of technical terminal details
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Handles educator confirming the access was unauthorized
  const handleKeepLocked = () => {
    setResolution('locked');
  };

  // Handles educator confirming legitimate activity
  const handleUnlock = () => {
    setResolution('unlocked');
  };

  // Resets the walkthrough to allow continuous demonstration
  const handleReset = () => {
    setResolution(null);
    setShowTechnicalDetails(false);
  };

  return (
    <SectionWrapper id="incident-walkthrough">
      <Container>
        {/* Header framing the human-first approach */}
        <SectionHeader>
          <div className="eyebrow">Human-First Security</div>
          <h2>No error codes. Just simple questions.</h2>
          <p>
            When an anomaly is flagged, Faculty Guard immediately blocks unauthorized access and asks you in plain English what to do next.
          </p>
        </SectionHeader>

        {/* The interactive teacher incident alert card */}
        <AlertCard $resolved={resolution === 'unlocked'}>
          {/* Banner showing high-level status */}
          <CardBanner $resolved={resolution === 'unlocked'}>
            <div className="status-left">
              {resolution === 'unlocked' ? (
                <>
                  <ShieldCheck size={18} />
                  <span>Access Verified · Account Unlocked</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  <span>Active Safeguard Triggered · Auto-Locked</span>
                </>
              )}
            </div>
            <div className="timestamp">Today, 2:14 PM UTC</div>
          </CardBanner>

          {/* Primary teacher-facing inquiry */}
          <CardBody>
            <div className="question-heading">
              "We blocked a massive download of your exams from an unknown location. Was this you?"
            </div>

            <div className="plain-description">
              Someone attempted to download 400 exam papers in 4 minutes from an unrecognized network. Your files remain safe and encrypted in quarantine.
            </div>

            {/* Interactive decision buttons */}
            {!resolution ? (
              <DecisionRow>
                <DangerButton onClick={handleKeepLocked}>
                  No, keep my account locked
                </DangerButton>
                <PrimaryButton onClick={handleUnlock}>
                  Yes, it was me – Unlock
                </PrimaryButton>
              </DecisionRow>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <AnimatePresence>
                  <ResolutionNotice
                    $action={resolution}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {resolution === 'locked' ? (
                      <div>
                        <strong>Account remains safely locked.</strong> We revoked all active session tokens and blocked the suspicious IP address. Your exam files remain secure.
                      </div>
                    ) : (
                      <div>
                        <strong>Verified.</strong> You authorized this session. Dual-factor verification confirmed your identity and unlocked your file library.
                      </div>
                    )}
                  </ResolutionNotice>
                </AnimatePresence>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <GhostButton $bordered onClick={handleReset} style={{ fontSize: '13px' }}>
                    <RotateCcw size={14} /> Reset Simulation
                  </GhostButton>
                  {onOpenAuth && (
                    <PrimaryButton onClick={onOpenAuth} style={{ fontSize: '13px' }}>
                      Test Portal Login
                    </PrimaryButton>
                  )}
                </div>
              </div>
            )}

            {/* Subtle technical toggle */}
            <div>
              <ToggleButton onClick={() => setShowTechnicalDetails((prev) => !prev)}>
                <Terminal size={14} />
                <span>{showTechnicalDetails ? '– Hide Technical Details' : '+ View Technical Details'}</span>
                {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </ToggleButton>
            </div>
          </CardBody>

          {/* Expandable technical details (JetBrains Mono) */}
          <AnimatePresence>
            {showTechnicalDetails && (
              <TechnicalDrawer
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid">
                  <div className="metric-item">
                    <span className="label">Client IP Address</span>
                    <span className="value">172.56.21.94 (Unknown ASN)</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Burst Download Rate</span>
                    <span className="value danger">400 files / 4.0 min</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Calculated Risk Score</span>
                    <span className="value danger">RISK SCORE: 94 / 100</span>
                  </div>
                  <div className="metric-item">
                    <span className="label">Detection Engine</span>
                    <span className="value">Isolation Forest (v2.1)</span>
                  </div>
                </div>
                <div className="log-line">
                  [ANOMALY_ENGINE] THRESHOLD_EXCEEDED &bull; Burst velocity 100 files/min &gt; Normal baseline (1.2 files/min). Action: AUTO_LOCK_SESSION.
                </div>
              </TechnicalDrawer>
            )}
          </AnimatePresence>
        </AlertCard>
      </Container>
    </SectionWrapper>
  );
}
