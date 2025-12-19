# Authentication Fixes

## Issues Fixed

### 1. Rate Limiting (429 Too Many Requests)
**Problem**: The global rate limiter was too restrictive (100 requests per 15 minutes), causing legitimate login attempts to be blocked.

**Solution**:
- Increased general API rate limit to 200 requests per 15 minutes
- Added separate, more lenient rate limiter for login attempts (10 attempts per 15 minutes)
- Excluded all auth routes from the general rate limiter
- Added `skipSuccessfulRequests: true` to login limiter (only counts failed attempts)

### 2. Token Expiration (Automatic Logout)
**Problem**: JWT tokens expired after 1 hour, causing users to be logged out frequently.

**Solution**:
- Increased JWT token expiration from `1h` to `24h` (24 hours)
- Increased refresh token expiration from `7d` to `30d` (30 days)
- Improved token refresh mechanism in frontend
- Better error handling for 429 and 401 errors

## Configuration

### JWT Token Settings
You can customize token expiration in your `.env` file:

```env
JWT_EXPIRES_IN=24h          # Access token expiration (default: 24h)
JWT_REFRESH_EXPIRES_IN=30d  # Refresh token expiration (default: 30d)
```

### Rate Limiting Settings
Rate limiting is configured in `server.js`:
- **General API**: 200 requests per 15 minutes
- **Login attempts**: 10 attempts per 15 minutes (only counts failed attempts)

## How It Works

1. **Login**: User logs in and receives both access token (24h) and refresh token (30d)
2. **Token Refresh**: When access token expires (401 error), frontend automatically uses refresh token to get new tokens
3. **Rate Limiting**: Login attempts are rate-limited separately to prevent brute force attacks while allowing normal API usage

## Testing

After restarting your backend server:
1. Login should work without hitting rate limits
2. You should stay logged in for 24 hours (instead of 1 hour)
3. If token expires, it should automatically refresh in the background

## Notes

- The refresh token mechanism works automatically in the background
- Users will only be logged out if:
  - They manually log out
  - The refresh token expires (after 30 days)
  - The refresh token is invalid or revoked







