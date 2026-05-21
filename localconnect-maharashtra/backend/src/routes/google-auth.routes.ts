import { Router } from 'express';
import { config } from '../config';

const router = Router();

/**
 * Google OAuth placeholder — configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 * Full Passport Google strategy can be enabled when credentials are provided.
 */
router.get('/google', (_req, res) => {
  if (!config.google.clientId) {
    res.status(501).json({
      error: 'Google OAuth not configured',
      message: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables',
    });
    return;
  }
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', (_req, res) => {
  res.redirect(`${config.frontendUrl}/login?oauth=pending`);
});

export default router;
