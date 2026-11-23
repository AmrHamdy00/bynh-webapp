/**
 * AUTH_DISABLE_2FA=1 skips the authenticator step and the forced password change — honoured ONLY together with
 * STAGING=1, so it can never weaken the real bynh.sa (production must not set STAGING).
 */
export const MFA_DISABLED = process.env.STAGING === '1' && process.env.AUTH_DISABLE_2FA === '1';
