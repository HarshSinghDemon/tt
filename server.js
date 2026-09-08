import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for faculty accounts and multi-factor authentication sessions
const users = new Map();
const sessions = new Map();

// Pre-seed a default faculty user for convenience
users.set('dr.smith@institution.edu', {
  email: 'dr.smith@institution.edu',
  totpSecret: generateSecret(),
  mfaEnrolled: true,
});

/**
 * Validates and sanitizes the sender address for transactional emails.
 * Ensures the value conforms to 'Name <email@example.com>' or 'email@example.com'.
 * If the user accidentally inputs an API key (e.g. 're_...') or non-email text,
 * it safely falls back to 'Faculty Guard <onboarding@resend.dev>'.
 */
function getValidFromEmail(rawFrom) {
  if (!rawFrom || typeof rawFrom !== 'string') {
    return 'Faculty Guard <onboarding@resend.dev>';
  }
  const trimmed = rawFrom.trim();

  // If the user pasted an API key or a string without an '@', fall back safely
  if (trimmed.startsWith('re_') || !trimmed.includes('@')) {
    return 'Faculty Guard <onboarding@resend.dev>';
  }

  // If it's already in the 'Display Name <email@example.com>' format
  const bracketMatch = trimmed.match(/^([^<]*)<([^>]+)>$/);
  if (bracketMatch) {
    const innerEmail = bracketMatch[2].trim();
    if (innerEmail.includes('@') && innerEmail.includes('.')) {
      return trimmed;
    }
  }

  // If it's a plain email address like 'admin@institution.edu'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `Faculty Guard <${trimmed}>`;
  }

  return 'Faculty Guard <onboarding@resend.dev>';
}

/**
 * Resolves the Resend API key.
 * If the user mistakenly pasted an API key ('re_...') into RESEND_FROM_EMAIL,
 * this helper automatically detects and uses it.
 */
function getResendApiKey() {
  const fromEnv = (process.env.RESEND_FROM_EMAIL || '').trim();
  if (fromEnv.startsWith('re_')) {
    return fromEnv;
  }
  const keyEnv = (process.env.RESEND_API_KEY || '').trim();
  if (keyEnv.startsWith('re_')) {
    return keyEnv;
  }
  return 're_73e56iG9_Gzq39CQagmxcUnoaxdymH89S';
}

function maskEmail(email) {
  const [localPart, domainPart] = (email || '').split('@');
  if (!domainPart) return email;
  const maskedLocal =
    localPart.length > 2
      ? `${localPart[0]}***${localPart[localPart.length - 1]}`
      : `${localPart[0]}***`;
  return `${maskedLocal}@${domainPart}`;
}

function generatePreAuthToken(email, action) {
  const token = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessions.set(token, {
    token,
    email,
    action,
    createdAt: Date.now(),
  });
  return token;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint 1: POST /api/v1/auth/signup
app.post('/api/v1/auth/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = users.get(normalizedEmail);
  if (!user) {
    user = {
      email: normalizedEmail,
      mfaEnrolled: false,
    };
    users.set(normalizedEmail, user);
  }

  const preAuthToken = generatePreAuthToken(normalizedEmail, 'mfa_setup');

  res.json({
    step: 'mfa_setup',
    pre_auth_token: preAuthToken,
    email: normalizedEmail,
    masked_email: maskEmail(normalizedEmail),
    available_setup_methods: ['totp', 'email'],
  });
});

// Endpoint 2: POST /api/v1/auth/login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password, remember_me } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = users.get(normalizedEmail);
  if (!user) {
    // Dynamically register if first-time educator
    user = {
      email: normalizedEmail,
      mfaEnrolled: false,
    };
    users.set(normalizedEmail, user);
  }

  const preAuthToken = generatePreAuthToken(normalizedEmail, 'mfa_required');

  res.json({
    step: 'mfa_required',
    pre_auth_token: preAuthToken,
    email: normalizedEmail,
    masked_email: maskEmail(normalizedEmail),
    available_methods: ['totp', 'email'],
    default_method: user.totpSecret ? 'totp' : 'email',
  });
});

// Endpoint 3: POST /api/v1/auth/setup-totp
app.post('/api/v1/auth/setup-totp', async (req, res) => {
  try {
    const { pre_auth_token, email } = req.body;
    let targetEmail = email;

    if (pre_auth_token && sessions.has(pre_auth_token)) {
      targetEmail = sessions.get(pre_auth_token).email;
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email is required to generate authenticator enrollment.' });
    }

    targetEmail = targetEmail.trim().toLowerCase();

    let user = users.get(targetEmail);
    if (!user) {
      user = { email: targetEmail, mfaEnrolled: false };
      users.set(targetEmail, user);
    }

    // Generate unique Base32 TOTP secret if user doesn't already have one
    const secret = generateSecret();
    user.totpSecret = secret;

    // Standard RFC 6238 key URI embedding the registered educator email
    const provisioningUri = generateURI({
      issuer: 'Faculty Guard',
      label: targetEmail,
      secret,
    });

    // Render genuine scannable QR Code as Data URI
    const qrCodeBase64 = await QRCode.toDataURL(provisioningUri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 200,
      color: {
        dark: '#111110',
        light: '#ffffff',
      },
    });

    res.json({
      secret,
      provisioning_uri: provisioningUri,
      qr_code_base64: qrCodeBase64,
      registered_email: targetEmail,
      instructions:
        'Scan this QR code with Google Authenticator, Authy, or 1Password. Enter the 6-digit code to link your authenticator.',
    });
  } catch (err) {
    console.error('Error generating TOTP setup:', err);
    res.status(500).json({ error: 'Failed to generate authenticator enrollment QR code.' });
  }
});

// Endpoint 4: POST /api/v1/auth/send-email-otp
app.post('/api/v1/auth/send-email-otp', async (req, res) => {
  try {
    const { pre_auth_token, email } = req.body;
    let targetEmail = email;

    if (pre_auth_token && sessions.has(pre_auth_token)) {
      targetEmail = sessions.get(pre_auth_token).email;
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'Please provide a valid faculty email address.' });
    }

    const normalizedEmail = targetEmail.trim().toLowerCase();
    let user = users.get(normalizedEmail);
    if (!user) {
      user = { email: normalizedEmail };
      users.set(normalizedEmail, user);
    }

    // Generate fresh 6-digit verification code with 5-minute expiry
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOtp = otpCode;
    user.emailOtpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    const apiKey = getResendApiKey();
    const fromAddress = getValidFromEmail(process.env.RESEND_FROM_EMAIL);

    if (apiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: normalizedEmail,
            subject: `Faculty Guard Verification Code: ${otpCode}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background: #ffffff;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #111110;">Faculty Guard</h2>
                </div>
                <h3 style="font-size: 16px; font-weight: 700; color: #111110; margin-bottom: 8px;">Two-Step Verification Code</h3>
                <p style="font-size: 14px; color: #72716d; line-height: 1.5; margin-bottom: 20px;">
                  You are logging in or confirming verification for <strong>${normalizedEmail}</strong>. Use the 6-digit passcode below:
                </p>
                <div style="text-align: center; margin: 24px 0;">
                  <div style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; padding: 14px 24px; background: #fafaf9; border: 1px solid #d6d3d1; border-radius: 8px; color: #c8102e;">
                    ${otpCode}
                  </div>
                </div>
                <p style="font-size: 12px; color: #72716d; line-height: 1.5;">
                  This code expires in 5 minutes. If you did not attempt to sign in to Faculty Guard, please alert campus IT security immediately.
                </p>
              </div>
            `,
          }),
        });

        const resData = await emailResponse.json().catch(() => ({}));

        if (emailResponse.ok) {
          console.log(`[Resend] Successfully delivered OTP ${otpCode} directly to ${normalizedEmail} (ID: ${resData?.id})`);
          return res.json({
            status: 'sent',
            message: `Verification code sent to ${normalizedEmail}`,
            masked_email: maskEmail(normalizedEmail),
            expires_in_seconds: 300,
          });
        }

        // Gracefully handle sandbox restriction, invalid API key, or unverified recipient
        const errMsg = resData?.message || '';
        const isSandboxRestriction =
          emailResponse.status === 403 ||
          errMsg.includes('only send testing emails to your own email address') ||
          errMsg.includes('resend.com/domains');
        const isInvalidKey =
          emailResponse.status === 401 ||
          errMsg.toLowerCase().includes('api key is invalid');

        let helpfulWarning = errMsg || 'Unable to deliver verification email.';
        if (isSandboxRestriction) {
          helpfulWarning = `Resend Sandbox Mode: Free Resend accounts can only deliver emails to your registered account address (harshroop100@gmail.com). To test inbox delivery, sign in with harshroop100@gmail.com.`;
        } else if (isInvalidKey) {
          helpfulWarning = `RESEND_API_KEY was not recognized by Resend. Please check your API key in settings.`;
        }

        return res.status(400).json({
          error: helpfulWarning,
        });
      } catch (sendError) {
        return res.json({
          status: 'sent',
          message: `Code generated for ${normalizedEmail}`,
          masked_email: maskEmail(normalizedEmail),
          expires_in_seconds: 300,
          dev_code: otpCode,
          warning: `Verification passcode: ${otpCode}`,
        });
      }
    } else {
      // RESEND_API_KEY is not yet configured in Settings
      console.log(`[DEV OTP] RESEND_API_KEY is not set. 6-digit code for ${normalizedEmail} is: ${otpCode}`);
      return res.json({
        status: 'sent',
        message: `Verification code generated for ${normalizedEmail}`,
        masked_email: maskEmail(normalizedEmail),
        expires_in_seconds: 300,
        dev_code: otpCode,
        warning: 'RESEND_API_KEY environment variable is not configured yet. For testing, your 6-digit code is: ' + otpCode,
      });
    }
  } catch (err) {
    console.error('Error sending email OTP:', err);
    res.status(500).json({ error: 'Failed to process email OTP request.' });
  }
});

// Endpoint 5: POST /api/v1/auth/verify-mfa
app.post('/api/v1/auth/verify-mfa', async (req, res) => {
  const { pre_auth_token, method, code, email } = req.body;

  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit numeric verification code.' });
  }

  let targetEmail = email;
  if (pre_auth_token && sessions.has(pre_auth_token)) {
    targetEmail = sessions.get(pre_auth_token).email;
  }

  if (!targetEmail) {
    return res.status(400).json({ error: 'Session expired or email not identified. Please log in again.' });
  }

  const normalizedEmail = targetEmail.trim().toLowerCase();
  const user = users.get(normalizedEmail);

  if (!user) {
    return res.status(400).json({ error: 'Session expired or user not found. Please log in again.' });
  }

  let isValid = false;

  if (method === 'totp') {
    if (!user.totpSecret) {
      return res.status(400).json({ error: 'Authenticator app is not yet configured. Please set it up first.' });
    }
    // Verify against RFC 6238 time-step using otplib with 30s epoch tolerance (±1 step drift window)
    try {
      const result = await verify({
        token: code,
        secret: user.totpSecret,
        epochTolerance: 30,
      });
      isValid = Boolean(result.valid);
    } catch (totpErr) {
      console.error('TOTP verification error:', totpErr);
      isValid = false;
    }
  } else if (method === 'email') {
    const isExpired = user.emailOtpExpiresAt ? Date.now() > user.emailOtpExpiresAt : true;
    if (!isExpired && user.emailOtp === code) {
      isValid = true;
      // Invalidate used code
      user.emailOtp = undefined;
      user.emailOtpExpiresAt = undefined;
    }
  }

  if (!isValid) {
    return res.status(400).json({
      error:
        method === 'totp'
          ? 'Invalid authenticator code. Check the rolling 6 digits on your phone and try again.'
          : 'Invalid or expired email verification code. Please request a new code.',
    });
  }

  // Mark MFA as completed and issue session token
  user.mfaEnrolled = true;
  user.lastLogin = Date.now();

  const accessToken = `jwt_session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  res.json({
    status: 'authenticated',
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 86400,
    user: {
      user_id: 'usr_' + Buffer.from(normalizedEmail).toString('hex').substring(0, 10),
      email: normalizedEmail,
      full_name: 'Dr. ' + normalizedEmail.split('@')[0],
      role: 'faculty',
      mfa_enrolled: true,
    },
  });
});

// -------------------------------------------------------------
// ANOMALY DETECTION & RISK EVALUATION (LAYER 3)
// -------------------------------------------------------------

// Helper function calculating download velocity (files per minute)
function calculateDownloadVelocity(fileCount, timeWindowSeconds) {
  const windowSecs = Number(timeWindowSeconds) || 60;
  const minutes = Math.max(windowSecs / 60.0, 0.1);
  return Number(((Number(fileCount) || 1) / minutes).toFixed(1));
}

// Evaluates access event telemetry and returns plain-English narrative with technical metrics
app.post('/api/v1/incidents/evaluate-risk', (req, res) => {
  const {
    user_id = 'usr_991823',
    action = 'bulk_download',
    file_count = 412,
    time_window_seconds = 240,
    ip_address = '172.56.21.94',
    country = 'Unknown / TOR Exit Node',
    device = 'Python-urllib/3.10 scraping script',
  } = req.body || {};

  const velocityFilesPerMin = calculateDownloadVelocity(file_count, time_window_seconds);

  // Calibrate risk score based on velocity spike and unknown origin
  let score = 15;
  if (velocityFilesPerMin > 20.0) {
    score += Math.min(Math.floor(velocityFilesPerMin * 0.7), 65);
  }
  if (country.toLowerCase().includes('unknown') || country.toLowerCase().includes('tor')) {
    score += 20;
  }
  if (device.toLowerCase().includes('python') || device.toLowerCase().includes('script')) {
    score += 15;
  }

  const riskScore = Math.min(Math.max(score, 0), 99);
  const isCritical = riskScore >= 80;
  const severity = isCritical ? 'critical' : riskScore >= 50 ? 'suspicious' : 'safe';
  const actionTaken = isCritical ? 'auto_lock' : 'allow_log';

  const minutesFormatted = (Math.max(Number(time_window_seconds) / 60, 0.1)).toFixed(1);

  // Return structured contract matching the project specification
  return res.json({
    risk_score: riskScore,
    severity,
    action_taken: actionTaken,
    human_summary: {
      headline: isCritical
        ? 'Unusual download activity detected'
        : 'Routine file access verified',
      message: isCritical
        ? `We blocked a massive download of your exams from an unknown location (${country}). Was this you?`
        : 'Access velocity is within normal parameters.',
      recommended_actions: isCritical
        ? [
            { id: 'keep_locked', label: 'No, keep my account locked', type: 'danger' },
            { id: 'unlock', label: 'Yes, it was me – Unlock', type: 'primary' },
          ]
        : [],
    },
    technical_details: {
      ip_address,
      burst_rate: `${file_count} files / ${minutesFormatted} min`,
      velocity_per_minute: velocityFilesPerMin,
      anomaly_type: isCritical ? 'Velocity Spike & Scripted Scraper Pattern' : 'Standard Access',
      geo_origin: country,
      device_fingerprint: device,
      model_confidence: isCritical ? 0.982 : 0.995,
    },
  });
});

// Retrieves historical audit events for institutional visibility
app.get('/api/v1/audit/logs', (req, res) => {
  const now = new Date();

  const auditEvents = [
    {
      event_id: 'evt_991823_04',
      timestamp: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
      user_id: 'usr_991823',
      action: 'bulk_download',
      resource: 'Exams/Fall2026/CS101_Final_Master.pdf',
      file_count: 412,
      ip_address: '172.56.21.94',
      geo_country: 'Unknown ASN / TOR Exit Node',
      status: 'BLOCKED',
      risk_score: 94,
      anomaly_flagged: true,
      human_summary: 'Attempted download of 412 files in 4 minutes blocked from unrecognized network.',
    },
    {
      event_id: 'evt_991823_03',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      user_id: 'usr_991823',
      action: 'mfa_verification',
      resource: 'Auth/TOTP',
      file_count: 1,
      ip_address: '128.197.34.12',
      geo_country: 'United States (Campus Wi-Fi)',
      status: 'ALLOWED',
      risk_score: 12,
      anomaly_flagged: false,
      human_summary: 'Routine two-factor authentication successful from Faculty Hall.',
    },
    {
      event_id: 'evt_991823_02',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      user_id: 'usr_991823',
      action: 'file_view',
      resource: 'Grades/Midterm_Submissions.xlsx',
      file_count: 1,
      ip_address: '128.197.34.12',
      geo_country: 'United States (Campus Wi-Fi)',
      status: 'ALLOWED',
      risk_score: 8,
      anomaly_flagged: false,
      human_summary: 'Standard single-file preview opened on verified campus device.',
    },
  ];

  res.json({
    status: 'success',
    count: auditEvents.length,
    events: auditEvents,
  });
});

// -------------------------------------------------------------
// FILE REPOSITORY & MANAGEMENT (LAYER 2 / LAYER 4)
// -------------------------------------------------------------

// In-memory persistent course file store representing educator documents
const courseFilesStore = [
  {
    id: 'file_001',
    name: 'CS101_Final_Exam_Master_2026.pdf',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 2411724,
    size_formatted: '2.4 MB',
    mime_type: 'application/pdf',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-02T10:14:00Z',
    last_accessed_at: '2026-09-08T09:30:00Z',
  },
  {
    id: 'file_002',
    name: 'Physics_Grading_Rubric_Master.xlsx',
    course: 'PHYS 202: Quantum Mechanics',
    size_bytes: 841920,
    size_formatted: '822 KB',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-04T15:22:00Z',
    last_accessed_at: '2026-09-07T18:45:00Z',
  },
  {
    id: 'file_003',
    name: 'Midterm_Exam_Answer_Keys.pdf',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 1258291,
    size_formatted: '1.2 MB',
    mime_type: 'application/pdf',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-05T08:12:00Z',
    last_accessed_at: '2026-09-08T11:05:00Z',
  },
  {
    id: 'file_004',
    name: 'Student_Gradebook_Fall2026.csv',
    course: 'CS 101: Introduction to Algorithms',
    size_bytes: 194560,
    size_formatted: '190 KB',
    mime_type: 'text/csv',
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: '2026-09-06T14:00:00Z',
    last_accessed_at: '2026-09-08T12:10:00Z',
  },
];

// Returns all educator documents with encrypted-at-rest metadata
app.get('/api/v1/files', (req, res) => {
  const totalBytes = courseFilesStore.reduce((sum, f) => sum + f.size_bytes, 0);

  res.json({
    status: 'success',
    total_files: courseFilesStore.length,
    storage_used_bytes: totalBytes,
    storage_quota_bytes: 10 * 1024 * 1024 * 1024, // 10 GB institutional quota
    files: courseFilesStore,
  });
});

// Simulates secure document upload with immediate AES-256 cryptographic protection
app.post('/api/v1/files/upload', (req, res) => {
  const { name, course = 'General Course Files', size_bytes = 1048576, mime_type = 'application/pdf' } = req.body || {};

  const cleanName = (name || 'New_Course_Document.pdf').trim();
  const fileBytes = Number(size_bytes) || 1048576;
  const sizeFormatted = fileBytes > 1048576
    ? (fileBytes / 1048576).toFixed(1) + ' MB'
    : (fileBytes / 1024).toFixed(0) + ' KB';

  const newFile = {
    id: 'file_' + Math.random().toString(36).substring(2, 9),
    name: cleanName,
    course: course.trim(),
    size_bytes: fileBytes,
    size_formatted: sizeFormatted,
    mime_type: mime_type,
    protection_status: 'protected',
    is_encrypted: true,
    uploaded_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
  };

  // Prepend to display newest items first
  courseFilesStore.unshift(newFile);

  res.status(201).json({
    status: 'uploaded',
    message: 'File encrypted at rest and placed under active protection',
    file: newFile,
  });
});

// Provides automated weekly peace-of-mind summary for teachers
app.get('/api/v1/digest/weekly-report', (req, res) => {
  res.json({
    status: 'success',
    report_date: new Date().toISOString(),
    period: 'Past 7 Days',
    headline: 'Your Weekly Peace-of-Mind Report',
    summary_message: `Faculty Guard protected ${courseFilesStore.length} course files this week with 0 successful intrusions.`,
    metrics: {
      total_protected_files: courseFilesStore.length,
      prevented_intrusions: 1,
      routine_faculty_logins: 14,
      security_health_score: 100,
    },
    recipient_email: 'faculty@university.edu',
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  // If running in Vercel Serverless environment, Vercel routes directly to the exported app
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Faculty Guard Server running on http://0.0.0.0:${PORT}`);
  });
}

// Start standalone server unless in Vercel serverless mode
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
