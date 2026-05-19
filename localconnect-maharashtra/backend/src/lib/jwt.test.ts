import { signAccessToken, verifyAccessToken } from './jwt';
import { Role } from '@prisma/client';

describe('JWT utilities', () => {
  const payload = { userId: 'test-user-id', email: 'test@example.com', role: Role.USER };

  it('should sign and verify access token', () => {
    const token = signAccessToken(payload);
    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(Role.USER);
  });
});
