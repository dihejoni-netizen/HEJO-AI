import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HejoUser {
  id: string; // Google sub
  name: string;
  email: string;
  picture?: string;
  createdAt: string;
}

export interface FlowGoogleAccount {
  id: string; // unique ID
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
  isActive: boolean;
  linkedAt: string;
}

interface ServerSession {
  sessionId: string;
  user: HejoUser | null;
  flowAccounts: FlowGoogleAccount[];
  serverTokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
  updatedAt: string;
}

// Persistent session storage file
const SESSIONS_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(SESSIONS_DIR, 'sessions.json');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

function loadSessions(): Map<string, ServerSession> {
  const map = new Map<string, ServerSession>();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.sessionId) {
            map.set(item.sessionId, item);
          }
        }
      }
    }
  } catch (err) {
    console.error('[OAuth] Failed to load sessions from disk:', err);
  }
  return map;
}

const sessions = loadSessions();

function saveSessionsToDisk() {
  try {
    const list = Array.from(sessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[OAuth] Failed to save sessions to disk:', err);
  }
}

export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  return Boolean(
    clientId.trim() && 
    clientSecret.trim() && 
    !clientId.includes('your_google_client_id') &&
    !clientSecret.includes('your_google_client_secret')
  );
}

function getRedirectUri(req: Request): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI && process.env.GOOGLE_OAUTH_REDIRECT_URI.trim()) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI.trim();
  }
  if (process.env.APP_URL && process.env.APP_URL.trim() && !process.env.APP_URL.includes('MY_APP_URL')) {
    const base = process.env.APP_URL.replace(/\/+$/, '');
    return `${base}/api/auth/google/callback`;
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  return `${proto}://${host}/api/auth/google/callback`;
}

function getOrCreateSession(req: Request, res: Response): ServerSession {
  let sessionId = req.cookies?.hejo_session_id;

  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }

  // Create fresh session
  sessionId = crypto.randomBytes(32).toString('hex');
  const newSession: ServerSession = {
    sessionId,
    user: null,
    flowAccounts: [],
    updatedAt: new Date().toISOString(),
  };

  sessions.set(sessionId, newSession);
  saveSessionsToDisk();

  const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('hejo_session_id', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });

  return newSession;
}

export const authRouter = Router();

// 1. GET /api/auth/me - Session status and connected accounts
authRouter.get('/me', (req: Request, res: Response) => {
  const isConfigured = isGoogleOAuthConfigured();
  const clientId = isConfigured ? (process.env.GOOGLE_CLIENT_ID || null) : null;
  const session = getOrCreateSession(req, res);

  const activeFlowAccount = session.flowAccounts.find((a) => a.isActive) || session.flowAccounts[0] || null;

  return res.json({
    isConfigured,
    clientId,
    user: session.user,
    flowAccounts: session.flowAccounts.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      picture: a.picture,
      isActive: Boolean(activeFlowAccount && a.id === activeFlowAccount.id),
      linkedAt: a.linkedAt,
    })),
    activeFlowAccount: activeFlowAccount
      ? {
          id: activeFlowAccount.id,
          email: activeFlowAccount.email,
          name: activeFlowAccount.name,
          picture: activeFlowAccount.picture,
          isActive: true,
          linkedAt: activeFlowAccount.linkedAt,
        }
      : null,
  });
});

// 2. GET /api/auth/google/login - Initiate OAuth for HEJO User Identity
authRouter.get('/google/login', (req: Request, res: Response) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect('/?tab=account&auth_error=oauth_not_configured');
  }

  const stateNonce = crypto.randomBytes(24).toString('hex');
  const statePayload = `login:${stateNonce}`;

  const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('hejo_oauth_state', statePayload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/',
  });

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = getRedirectUri(req);
  const scope = encodeURIComponent('openid email profile');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
    statePayload
  )}&access_type=offline&prompt=consent`;

  return res.redirect(googleAuthUrl);
});

// 3. GET /api/auth/google/link-flow - Initiate OAuth for Linking a Flow Google Account
authRouter.get('/google/link-flow', (req: Request, res: Response) => {
  if (!isGoogleOAuthConfigured()) {
    return res.redirect('/?tab=account&auth_error=oauth_not_configured');
  }

  const stateNonce = crypto.randomBytes(24).toString('hex');
  const statePayload = `link_flow:${stateNonce}`;

  const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('hejo_oauth_state', statePayload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 10 * 60 * 1000, // 10 minutes
    path: '/',
  });

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = getRedirectUri(req);
  const scope = encodeURIComponent('openid email profile');
  // prompt=select_account ensures Google shows account picker so user can link different account
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
    statePayload
  )}&access_type=offline&prompt=select_account`;

  return res.redirect(googleAuthUrl);
});

// 4. GET /api/auth/google/callback - Handle OAuth Callback from Google
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    console.warn('[OAuth] Google returned error:', error);
    return res.redirect(`/?tab=account&auth_error=${encodeURIComponent(String(error))}`);
  }

  const savedState = req.cookies?.hejo_oauth_state;
  res.clearCookie('hejo_oauth_state', { path: '/' });

  if (!code || !state || typeof state !== 'string' || state !== savedState) {
    console.warn('[OAuth] Invalid CSRF state verification');
    return res.redirect('/?tab=account&auth_error=invalid_state');
  }

  const [purpose] = state.split(':');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri(req);

  if (!clientId || !clientSecret) {
    return res.redirect('/?tab=account&auth_error=missing_credentials');
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('[OAuth] Token exchange failed:', errText);
      return res.redirect('/?tab=account&auth_error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect('/?tab=account&auth_error=missing_access_token');
    }

    // Retrieve user profile using minimal OpenID Connect endpoint
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      return res.redirect('/?tab=account&auth_error=profile_fetch_failed');
    }

    const profile = await userinfoResponse.json();
    const googleSub = profile.sub || profile.id;
    const googleEmail = profile.email;
    const googleName = profile.name || profile.email?.split('@')[0] || 'Pengguna HEJO';
    const googlePicture = profile.picture;

    const session = getOrCreateSession(req, res);

    if (purpose === 'login' || !session.user) {
      // 1. Establish or update HEJO User Identity
      session.user = {
        id: googleSub,
        email: googleEmail,
        name: googleName,
        picture: googlePicture,
        createdAt: session.user?.createdAt || new Date().toISOString(),
      };

      // Also ensure this Google account is linked as a Flow Account if not already present
      const existingFlowAcc = session.flowAccounts.find(
        (a) => a.email.toLowerCase() === googleEmail.toLowerCase()
      );

      if (!existingFlowAcc) {
        const isFirst = session.flowAccounts.length === 0;
        session.flowAccounts.push({
          id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          googleSub,
          email: googleEmail,
          name: googleName,
          picture: googlePicture,
          isActive: isFirst,
          linkedAt: new Date().toLocaleDateString('id-ID'),
        });
      }
    } else if (purpose === 'link_flow') {
      // 2. Multi-Account: Link an additional Flow Google Account
      const existing = session.flowAccounts.find(
        (a) => a.email.toLowerCase() === googleEmail.toLowerCase()
      );

      if (existing) {
        // If already connected, make sure name/pic is fresh
        existing.name = googleName;
        existing.picture = googlePicture;
      } else {
        const hasActive = session.flowAccounts.some((a) => a.isActive);
        session.flowAccounts.push({
          id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          googleSub,
          email: googleEmail,
          name: googleName,
          picture: googlePicture,
          isActive: !hasActive, // Active if none were active
          linkedAt: new Date().toLocaleDateString('id-ID'),
        });
      }
    }

    // Securely hold tokens on server-side only (never sent to client)
    session.serverTokens = {
      accessToken,
      refreshToken: tokenData.refresh_token || session.serverTokens?.refreshToken,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
    };
    session.updatedAt = new Date().toISOString();

    saveSessionsToDisk();

    return res.redirect('/?tab=account&auth=success');
  } catch (err) {
    console.error('[OAuth] Callback exception:', err);
    return res.redirect('/?tab=account&auth_error=internal_error');
  }
});

// 5. POST /api/auth/flow-accounts/active - Set Active Flow Account
authRouter.post('/flow-accounts/active', (req: Request, res: Response) => {
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ error: 'accountId diperlukan' });
  }

  const session = getOrCreateSession(req, res);
  const target = session.flowAccounts.find((a) => a.id === accountId);

  if (!target) {
    return res.status(404).json({ error: 'Akun Flow tidak ditemukan' });
  }

  // Exactly one account is active at any time
  session.flowAccounts.forEach((a) => {
    a.isActive = a.id === accountId;
  });
  session.updatedAt = new Date().toISOString();
  saveSessionsToDisk();

  return res.json({
    success: true,
    activeAccountId: accountId,
    flowAccounts: session.flowAccounts,
  });
});

// 6. DELETE /api/auth/flow-accounts/:id - Remove Connected Flow Account
authRouter.delete('/flow-accounts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = getOrCreateSession(req, res);

  const idx = session.flowAccounts.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Akun Flow tidak ditemukan' });
  }

  const wasActive = session.flowAccounts[idx].isActive;
  session.flowAccounts.splice(idx, 1);

  // If the active account was removed, designate the first remaining account as active
  if (wasActive && session.flowAccounts.length > 0) {
    session.flowAccounts[0].isActive = true;
  }

  session.updatedAt = new Date().toISOString();
  saveSessionsToDisk();

  return res.json({
    success: true,
    flowAccounts: session.flowAccounts,
  });
});

// 7. POST /api/auth/logout - Logout from HEJO User Session
authRouter.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.hejo_session_id;
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    saveSessionsToDisk();
  }

  res.clearCookie('hejo_session_id', { path: '/' });
  res.clearCookie('hejo_oauth_state', { path: '/' });

  return res.json({ success: true });
});
