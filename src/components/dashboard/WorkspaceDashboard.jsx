import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Shield,
  FolderLock,
  Bell,
  Mail,
  LogOut,
  Settings,
  HardDrive,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { GhostButton, PrimaryButton } from '../common/Button.jsx';
import FileManagerView from './FileManagerView.jsx';
import ActivityAlertsView from './ActivityAlertsView.jsx';
import WeeklyDigestView from './WeeklyDigestView.jsx';

const DashboardRoot = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.colors.offWhite};
  color: ${(props) => props.theme.colors.ink};
  display: flex;
  flex-direction: column;
`;

// Top Header Bar with institutional branding and active session status
const TopBar = styled.header`
  height: 64px;
  background-color: ${(props) => props.theme.colors.white};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
`;

const BrandSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: ${(props) => props.theme.colors.ink};
  }

  .badge {
    font-size: 11px;
    font-weight: 700;
    color: #047857;
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 9999px;
    padding: 2px 8px;
  }
`;

const UserControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  .user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.ink};

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: ${(props) => props.theme.colors.redLight};
      color: ${(props) => props.theme.colors.red};
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${(props) => props.theme.colors.redMid};
    }
  }
`;

// Sub-navigation bar switching between Workspace Views
const SubNav = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow-x: auto;
`;

const TabList = styled.div`
  display: flex;
  gap: 24px;
`;

const NavTab = styled.button`
  background: none;
  border: none;
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.colors.red : 'transparent')};
  color: ${(props) => (props.$active ? props.theme.colors.ink : props.theme.colors.soft)};
  font-family: ${(props) => props.theme.typography.displayFont};
  font-size: 13.5px;
  font-weight: ${(props) => (props.$active ? '700' : '500')};
  padding: 14px 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    color: ${(props) => props.theme.colors.ink};
  }
`;

// Main workspace content canvas
const ContentCanvas = styled.main`
  flex: 1;
  max-width: 1140px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 64px 24px;
`;

// Settings Drawer Overlay
const SettingsModal = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(17, 17, 16, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const SettingsCard = styled.div`
  background: white;
  width: 100%;
  max-width: 480px;
  border-radius: ${(props) => props.theme.radii.card};
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: ${(props) => props.theme.colors.ink};
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;

    label {
      font-weight: 600;
      color: ${(props) => props.theme.colors.ink};
    }

    p {
      color: ${(props) => props.theme.colors.soft};
      line-height: 1.4;
    }
  }
`;

/**
 * WorkspaceDashboard Component
 * The post-login teacher interface providing the Google Drive-style file manager,
 * activity and alerts center, and weekly peace-of-mind summary.
 */
export default function WorkspaceDashboard({ userProfile, onLogout }) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'activity' | 'digest'
  const [showSettings, setShowSettings] = useState(false);

  const email = userProfile?.email || 'dr.roberts@university.edu';
  const name = userProfile?.full_name || 'Dr. Roberts';
  const initial = name.replace('Dr. ', '').charAt(0) || 'R';

  return (
    <DashboardRoot id="workspace-dashboard">
      {/* Top Bar */}
      <TopBar>
        <BrandSection>
          <div className="brand-logo">
            <Shield size={18} color="#c8102e" />
            <span>Faculty Guard</span>
          </div>
          <span className="badge">Active Protection</span>
        </BrandSection>

        <UserControls>
          <div className="user-badge">
            <div className="avatar">{initial}</div>
            <span style={{ fontSize: '13px' }}>{name}</span>
          </div>

          <GhostButton $small $bordered onClick={() => setShowSettings(true)} title="Security Settings">
            <Settings size={14} />
          </GhostButton>

          <GhostButton $small $bordered onClick={onLogout} title="Sign Out">
            <LogOut size={14} />
            <span style={{ fontSize: '12.5px' }}>Sign Out</span>
          </GhostButton>
        </UserControls>
      </TopBar>

      {/* Sub-navigation Tabs */}
      <SubNav>
        <TabList>
          <NavTab $active={activeTab === 'files'} onClick={() => setActiveTab('files')}>
            <FolderLock size={15} />
            <span>My Course Files</span>
          </NavTab>

          <NavTab $active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
            <Bell size={15} />
            <span>Activity & Alerts</span>
          </NavTab>

          <NavTab $active={activeTab === 'digest'} onClick={() => setActiveTab('digest')}>
            <Mail size={15} />
            <span>Weekly Digest</span>
          </NavTab>
        </TabList>

        <div style={{ fontSize: '12px', color: '#72716d', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HardDrive size={13} />
          <span>4.7 MB of 10 GB used</span>
        </div>
      </SubNav>

      {/* Main Workspace Body */}
      <ContentCanvas>
        {activeTab === 'files' && <FileManagerView />}
        {activeTab === 'activity' && <ActivityAlertsView />}
        {activeTab === 'digest' && <WeeklyDigestView userEmail={email} />}
      </ContentCanvas>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClick={() => setShowSettings(false)}>
          <SettingsCard onClick={(e) => e.stopPropagation()}>
            <h3>Security & Preferences</h3>

            <div className="field-group">
              <label>Authentication Protocol</label>
              <p>Dual-factor authentication is active on your account via verified email and authenticator app.</p>
            </div>

            <div className="field-group">
              <label>Autonomous Safeguard Threshold</label>
              <p>Auto-lock velocity triggers if more than 20 exams/minute are requested from unrecognized IP ranges.</p>
            </div>

            <div className="field-group">
              <label>Weekly Digest Schedule</label>
              <p>Scheduled every Friday at 4:00 PM UTC to {email}.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <PrimaryButton $small onClick={() => setShowSettings(false)}>
                Done
              </PrimaryButton>
            </div>
          </SettingsCard>
        </SettingsModal>
      )}
    </DashboardRoot>
  );
}
