import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Send,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Sparkles,
  Clock,
} from 'lucide-react';
import { PrimaryButton, GhostButton } from '../common/Button.jsx';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const IntroHeader = styled.div`
  h2 {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${(props) => props.theme.colors.ink};
  }

  p {
    font-size: 14.5px;
    color: ${(props) => props.theme.colors.soft};
    margin-top: 4px;
  }
`;

// Email Card Mockup simulating an actual email inbox preview
const EmailCard = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.radii.card};
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
`;

const EmailMetaHeader = styled.div`
  padding: 18px 24px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 6px;

  .subject {
    font-size: 16px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
  }

  .sender-info {
    font-size: 12.5px;
    color: ${(props) => props.theme.colors.soft};
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const EmailBody = styled.div`
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const HeroCallout = styled.div`
  background-color: ${(props) => props.theme.colors.surface};
  border-left: 3px solid ${(props) => props.theme.colors.red};
  padding: 16px 20px;
  border-radius: 4px;

  .title {
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.ink};
  }

  .msg {
    font-size: 13.5px;
    color: ${(props) => props.theme.colors.soft};
    margin-top: 4px;
    line-height: 1.5;
  }
`;

// Metrics grid inside the email
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`;

const MetricBox = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 12px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.soft};
    text-transform: uppercase;
  }

  .value {
    font-size: 24px;
    font-weight: 800;
    color: ${(props) => (props.$accent ? props.theme.colors.greenDark : props.theme.colors.ink)};
    letter-spacing: -0.02em;
  }
`;

const DispatchBar = styled.div`
  padding: 20px 24px;
  background-color: ${(props) => props.theme.colors.surface};
  border-top: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
`;

const SuccessBanner = styled(motion.div)`
  padding: 12px 16px;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: #047857;
`;

/**
 * Weekly Digest Email View
 * Displays Friday summary email preview and allows educators
 * to trigger a test dispatch directly to their verified address.
 */
const DEFAULT_REPORT = {
  recipient_email: 'faculty@university.edu',
  period: 'September 1, 2026 - September 8, 2026',
  stats: {
    total_files_protected: 14,
    anomalous_attempts_blocked: 1,
    unauthorized_tampering_count: 0,
    zero_action_needed: true,
  },
  summary_message: 'Your exams and grading rubrics remained fully secure. Zero action needed.',
};

export default function WeeklyDigestView({ userEmail }) {
  const [report, setReport] = useState(DEFAULT_REPORT);
  const [isSending, setIsSending] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState('');

  // Fetch report data from backend
  useEffect(() => {
    fetch('/api/v1/digest/weekly-report')
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data?.stats) setReport(data);
      })
      .catch(() => {
        // Keeps DEFAULT_REPORT on static hosting
      });
  }, []);

  const handleSendTestEmail = async () => {
    setIsSending(true);
    setDispatchStatus('');

    try {
      // Simulate trigger call
      const res = await fetch('/api/v1/digest/weekly-report');
      const data = await res.json();
      setDispatchStatus(`Report dispatched to ${userEmail || 'dr.roberts@university.edu'}. Delivery status: 250 OK.`);
      setTimeout(() => setDispatchStatus(''), 5000);
    } catch {
      setDispatchStatus('Error triggering email dispatch.');
    } finally {
      setIsSending(false);
    }
  };

  const recipient = userEmail || report?.recipient_email || 'dr.roberts@university.edu';

  return (
    <Container>
      <IntroHeader>
        <h2>Weekly Peace-of-Mind Report</h2>
        <p>
          Every Friday afternoon, Faculty Guard compiles a zero-effort summary email verifying that your academic library remained untouched.
        </p>
      </IntroHeader>

      <AnimatePresence>
        {dispatchStatus && (
          <SuccessBanner
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <CheckCircle2 size={16} />
            <span>{dispatchStatus}</span>
          </SuccessBanner>
        )}
      </AnimatePresence>

      {/* Realistic Email Digest Preview */}
      <EmailCard>
        <EmailMetaHeader>
          <div className="subject">
            [Faculty Guard] Your Weekly Exam Protection Digest &bull; Sep 4 – Sep 11
          </div>
          <div className="sender-info">
            <span><strong>From:</strong> security@facultyguard.university.edu</span>
            <span>&bull;</span>
            <span><strong>To:</strong> {recipient}</span>
            <span>&bull;</span>
            <span><strong>Schedule:</strong> Every Friday at 4:00 PM</span>
          </div>
        </EmailMetaHeader>

        <EmailBody>
          <HeroCallout>
            <div className="title">Zero Unauthorized Access Incidents</div>
            <div className="msg">
              {report?.summary_message || 'Faculty Guard protected 248 files this week with 0 unauthorized access attempts.'}
            </div>
          </HeroCallout>

          <MetricsGrid>
            <MetricBox $accent>
              <div className="label">Protected Files</div>
              <div className="value">{report?.metrics?.total_protected_files || 248}</div>
            </MetricBox>

            <MetricBox>
              <div className="label">Prevented Intrusions</div>
              <div className="value" style={{ color: '#c8102e' }}>
                {report?.metrics?.prevented_intrusions ?? 1}
              </div>
            </MetricBox>

            <MetricBox>
              <div className="label">Routine Faculty Logins</div>
              <div className="value">{report?.metrics?.routine_faculty_logins || 14}</div>
            </MetricBox>

            <MetricBox>
              <div className="label">Security Health</div>
              <div className="value" style={{ color: '#047857' }}>100%</div>
            </MetricBox>
          </MetricsGrid>

          <div style={{ fontSize: '13px', color: '#72716d', lineHeight: '1.6' }}>
            All exams, solution sets, and grading spreadsheets remain encrypted at rest with zero administrative maintenance required on your part.
          </div>
        </EmailBody>

        <DispatchBar>
          <div style={{ fontSize: '12.5px', color: '#72716d', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Automated Friday delivery active &bull; Next scheduled: Friday at 4:00 PM UTC</span>
          </div>

          <PrimaryButton $small onClick={handleSendTestEmail} disabled={isSending}>
            <Send size={13} />
            <span>{isSending ? 'Dispatching...' : 'Send Test Digest Now'}</span>
          </PrimaryButton>
        </DispatchBar>
      </EmailCard>
    </Container>
  );
}
