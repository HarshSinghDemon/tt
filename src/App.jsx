import React, { useState } from 'react';
import styled from 'styled-components';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/layout/Navbar.jsx';
import HeroCommandCenter from './components/sections/HeroCommandCenter.jsx';
import StoryFeatures from './components/sections/StoryFeatures.jsx';
import IncidentWalkthrough from './components/sections/IncidentWalkthrough.jsx';
import Footer from './components/layout/Footer.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import WorkspaceDashboard from './components/dashboard/WorkspaceDashboard.jsx';

// Fallback Google Client ID for development / preview environments
const GOOGLE_CLIENT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
  '381592416142-facultyguard.apps.googleusercontent.com';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.ink};
  font-family: ${(props) => props.theme.typography.displayFont};
  display: flex;
  flex-direction: column;
  position: relative;
`;

const MainContent = styled.main`
  flex: 1;
`;

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const handleOpenAuth = () => {
    setIsAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
  };

  const handleAuthSuccess = (authResult) => {
    setIsAuthenticated(true);
    setUserProfile(
      authResult?.user || {
        email: 'dr.roberts@university.edu',
        full_name: 'Dr. Angela Roberts',
        role: 'faculty',
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('faculty_guard_token');
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContainer id="facultyguard-root">
        {/* If educator is authenticated, show the Secure Workspace Dashboard */}
        {isAuthenticated ? (
          <WorkspaceDashboard userProfile={userProfile} onLogout={handleLogout} />
        ) : (
          <>
            {/* Sticky Premium Navbar */}
            <Navbar onOpenAuth={handleOpenAuth} />

            <MainContent>
              {/* Hero (Security Command Center) */}
              <HeroCommandCenter onOpenAuth={handleOpenAuth} />

              {/* Story-Driven Features */}
              <StoryFeatures />

              {/* Interactive Human-First Incident Walkthrough */}
              <IncidentWalkthrough onOpenAuth={handleOpenAuth} />
            </MainContent>

            {/* Footer */}
            <Footer onOpenAuth={handleOpenAuth} />

            {/* Authentication Modal (Secure Portal) */}
            <AuthModal
              isOpen={isAuthOpen}
              onClose={handleCloseAuth}
              onSuccess={handleAuthSuccess}
            />
          </>
        )}
      </AppContainer>
    </GoogleOAuthProvider>
  );
}

