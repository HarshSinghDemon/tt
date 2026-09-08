import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';
import { PrimaryButton, DangerButton, GhostButton } from '../common/Button.jsx';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

// Active Alert Card with red border when pending, green when verified
const ActiveAlertCard = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => (props.$resolved ? props.theme.colors.greenBorder : props.theme.colors.redMid)};
  border-radius: ${(props) => props.theme.radii.card};
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(17, 17, 16, 0.04);
`;

const Banner = styled.div`
  padding: 16px 22px;
  background-color: ${(props) => (props.$resolved ? props.theme.colors.greenLight : props.theme.colors.redLight)};
  border-bottom: 1px solid ${(props) => (props.$resolved ? props.theme.colors.greenBorder : props.theme.colors.redMid)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 700;
    color: ${(props) => (props.$resolved ? props.theme.colors.greenDark : props.theme.colors.red)};
  }

  .time {
    font-family: ${(props) => props.theme.typography.monoFont};
    font-size: 12px;
    color: ${(props) => props.theme.colors.soft};
  }
`;

const AlertBody = styled.div`
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .headline {
    font-size: 18px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
    line-height: 1.4;
  }

  .explanation {
    font-size: 14.5px;
    color: ${(props) => props.theme.colors.soft};
    line-height: 1.6;
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

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

// Terminal-styled drawer displaying raw telemetry in JetBrains Mono
const TelemetryDrawer = styled(motion.div)`
  border-top: 1px solid ${(props) => props.theme.colors.border};
  background-color: #161615;
  color: #d4d0c8;
  padding: 20px 24px;
  font-family: ${(props) => props.theme.typography.monoFont};
  font-size: 12.5px;
  line-height: 1.8;

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .label {
      font-size: 11px;
      color: #72716d;
      text-transform: uppercase;
    }

    .val {
      color: #ffffff;
      font-weight: 600;
    }

    .val.danger {
      color: #f87171;
    }
  }

  .raw-log {
    border-top: 1px solid #292926;
    padding-top: 10px;
    color: #9ca3af;
    font-size: 11.5px;
  }
`;

// Audit History Section
const AuditCard = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radii.card};
  overflow: hidden;
`;

const AuditHeader = styled.div`
  padding: 16px 22px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => props.theme.colors.ink};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AuditList = styled.div`
  display: flex;
  flex-direction: column;
`;

const AuditItem = styled.div`
  padding: 16px 22px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .action-title {
      font-size: 13.5px;
      font-weight: 600;
      color: ${(props) => props.theme.colors.ink};
    }

    .summary-text {
      font-size: 12.5px;
      color: ${(props) => props.theme.colors.soft};
    }

    .meta {
      font-family: ${(props) => props.theme.typography.monoFont};
      font-size: 11.5px;
      color: #72716d;
    }
  }
`;

const StatusPill = styled.span`
  font-family: ${(props) => props.theme.typography.monoFont};
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.$blocked ? '#fee2e2' : '#ecfdf5')};
  color: ${(props) => (props.$blocked ? '#991b1b' : '#065f46')};
  border: 1px solid ${(props) => (props.$blocked ? '#fca5a5' : '#a7f3d0')};
`;

/**
 * Activity & Alert Center
 * Shows human-first alerts, action resolution, and audit logs.
 */
const DEFAULT_LOGS = [
  {
    id: 'evt_101',
    timestamp: '2026-09-08 14:12:05 UTC',
    actor: 'amantiwary771@gmail.com',
    ip_address: '198.51.100.44 (TOR Exit Relay)',
    action: 'BURST_DOWNLOAD_ATTEMPT',
    status: 'BLOCKED',
    anomaly_score: 0.94,
    detail: 'Automated burst script detected (24 documents queried in 3.1s)',
  },
  {
    id: 'evt_102',
    timestamp: '2026-09-08 09:30:11 UTC',
    actor: 'amantiwary771@gmail.com',
    ip_address: '130.126.255.1 (Campus Network)',
    action: 'VIEW_DOCUMENT',
    status: 'ALLOW',
    anomaly_score: 0.08,
    detail: 'Routine exam file preview from authenticated classroom terminal',
  },
  {
    id: 'evt_103',
    timestamp: '2026-09-07 18:45:00 UTC',
    actor: 'amantiwary771@gmail.com',
    ip_address: '130.126.255.1 (Campus Network)',
    action: 'FILE_ENCRYPT_AT_REST',
    status: 'ALLOW',
    anomaly_score: 0.02,
    detail: 'AES-256 GCM key rotation applied to Physics Grading Rubric',
  },
];

export default function ActivityAlertsView() {
  const [resolution, setResolution] = useState(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [auditLogs, setAuditLogs] = useState(DEFAULT_LOGS);

  // Load audit history
  useEffect(() => {
    fetch('/api/v1/audit/logs')
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data?.events && Array.isArray(data.events)) setAuditLogs(data.events);
      })
      .catch(() => {
        // Keeps DEFAULT_LOGS on static hosting
      });
  }, []);

  return (
    <Container>
      {/* Real-time Human-First Alert Card */}
      <ActiveAlertCard $resolved={resolution === 'unlocked'}>
        <Banner $resolved={resolution === 'unlocked'}>
          <div className="left">
            {resolution === 'unlocked' ? (
              <>
                <ShieldCheck size={16} />
                <span>Access Authorized · Files Unlocked</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Safeguard Intercept · Velocity Spike Blocked</span>
              </>
            )}
          </div>
          <div className="time">Today, 2:14 PM UTC</div>
        </Banner>

        <AlertBody>
          <div className="headline">
            "We blocked a massive download of your exams from an unknown location. Was this you?"
          </div>

          <div className="explanation">
            An external IP requested 400 exam papers in 4 minutes from an unknown network. To prevent test compromise, access was paused immediately.
          </div>

          {!resolution ? (
            <ActionRow>
              <DangerButton onClick={() => setResolution('locked')}>
                No, keep my account locked
              </DangerButton>
              <PrimaryButton onClick={() => setResolution('unlocked')}>
                Yes, it was me – Unlock
              </PrimaryButton>
            </ActionRow>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13.5px', color: resolution === 'locked' ? '#c8102e' : '#059669', fontWeight: 600 }}>
                {resolution === 'locked'
                  ? 'Account securely preserved. Session tokens revoked and attacker IP blocked.'
                  : 'Identity confirmed via two-factor auth. Course library unlocked.'}
              </div>
              <GhostButton $small $bordered onClick={() => setResolution(null)} style={{ width: 'fit-content' }}>
                <RotateCcw size={13} /> Reset Alert Status
              </GhostButton>
            </div>
          )}

          <div>
            <ToggleButton onClick={() => setShowTechnical((prev) => !prev)}>
              <Terminal size={14} />
              <span>{showTechnical ? '– Hide Technical Details' : '+ View Technical Details'}</span>
              {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </ToggleButton>
          </div>
        </AlertBody>

        <AnimatePresence>
          {showTechnical && (
            <TelemetryDrawer
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid">
                <div className="field">
                  <span className="label">Originating IP</span>
                  <span className="val">172.56.21.94</span>
                </div>
                <div className="field">
                  <span className="label">Burst Rate</span>
                  <span className="val danger">400 files / 4.0 min</span>
                </div>
                <div className="field">
                  <span className="label">Calculated Risk Score</span>
                  <span className="val danger">RISK SCORE: 94/100</span>
                </div>
                <div className="field">
                  <span className="label">Inference Engine</span>
                  <span className="val">Isolation Forest (v2.1)</span>
                </div>
              </div>
              <div className="raw-log">
                [ANOMALY_ENGINE] DETECTED_VELOCITY_BURST: 100 files/min exceeded threshold (20/min). Action: AUTO_LOCK_ENFORCED.
              </div>
            </TelemetryDrawer>
          )}
        </AnimatePresence>
      </ActiveAlertCard>

      {/* Historical Audit Trail */}
      <AuditCard>
        <AuditHeader>
          <span>Audit & Access Trail</span>
          <span style={{ fontSize: '12px', color: '#72716d' }}>Cryptographically signed events</span>
        </AuditHeader>

        <AuditList>
          {auditLogs.map((log) => (
            <AuditItem key={log.event_id}>
              <div className="info">
                <div className="action-title">{log.action.replace('_', ' ').toUpperCase()}</div>
                <div className="summary-text">{log.human_summary}</div>
                <div className="meta">
                  {log.ip_address} &bull; {log.geo_country} &bull; {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <StatusPill $blocked={log.status === 'BLOCKED'}>
                  {log.status}
                </StatusPill>
              </div>
            </AuditItem>
          ))}
        </AuditList>
      </AuditCard>
    </Container>
  );
}
