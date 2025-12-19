# Trust Proxy Fix - Permanent Solution

## Problem
The application was throwing `ERR_ERL_PERMISSIVE_TRUST_PROXY` errors from express-rate-limit because:
1. Trust proxy was hardcoded to `1` without environment variable support
2. express-rate-limit validation was not properly disabled
3. The `skipRateLimitOnError` option doesn't prevent validation errors (only runtime errors)

## Solution Implemented

### 1. Environment-Based Trust Proxy Configuration
- Added `TRUST_PROXY_HOPS` environment variable support
- Defaults to `1` in production (behind Nginx), `0` in development
- Safely clamps values to 0-5 range
- Single source of truth for trust proxy configuration

### 2. Proper Validation Disable
- Added `validate: { trustProxy: false }` to all rate limiters
- This tells express-rate-limit to skip the trust proxy validation check
- Prevents the `ERR_ERL_PERMISSIVE_TRUST_PROXY` error at initialization

### 3. Improved Key Generator
- Uses `req.ip` which is automatically set by Express based on trust proxy
- Falls back to `req.socket?.remoteAddress` for safety
- Works correctly whether behind proxy or not

### 4. Startup Logging
- Logs trust proxy configuration at startup
- Shows hops, setting value, and environment
- Helps with debugging and verification

## Files Changed

### `server.js`
- Lines 14-35: Trust proxy configuration with env variable support
- Lines 57-81: `apiLimiter` with proper validation disable
- Lines 84-102: `authLimiter` with proper validation disable
- Lines 160-172: Startup logging for trust proxy

### `routes/auth.routes.js`
- Lines 11-29: `loginLimiter` with proper validation disable

## Environment Variable

Add to `.env` or `.env.production`:
```bash
# Trust proxy hops (0 = no proxy, 1 = Nginx, 2 = Nginx + LB, etc.)
# Default: 1 in production, 0 in development
TRUST_PROXY_HOPS=1
```

## Verification Commands

### On Server:
```bash
# 1. Pull latest code
cd /opt/amast-crm/amast-crm
git pull

# 2. Restart backend
pm2 restart amast-crm-backend

# 3. Check for errors (should be empty)
pm2 logs amast-crm-backend --err --lines 50

# 4. Check startup logs (should show trust proxy config)
pm2 logs amast-crm-backend --out --lines 20 | grep -i "trust proxy"

# 5. Verify no ERR_ERL_PERMISSIVE_TRUST_PROXY errors
pm2 logs amast-crm-backend --err --lines 100 | grep -i "ERR_ERL"
# Should return nothing
```

### Expected Startup Log Output:
```
Trust proxy configuration: { hops: 1, setting: 1, environment: 'production', TRUST_PROXY_HOPS: '1' }
Server running on port 3001 in production mode
Trust proxy configuration: { hops: 1, setting: 1, note: 'Trusting 1 proxy hop(s) - req.ip will use X-Forwarded-For' }
```

## Why Previous Attempts Failed

1. **`skipRateLimitOnError: true`**: This only prevents errors during rate limit checks, not validation errors at initialization
2. **Custom `keyGenerator` alone**: While it helps, express-rate-limit still validates trust proxy at initialization
3. **`validate: { trustProxy: false }` was missing**: This is the key option that disables the validation check entirely

## Testing Locally

```bash
# Test without proxy (development)
NODE_ENV=development npm start
# Should show: hops: 0, setting: false

# Test with proxy (production)
NODE_ENV=production TRUST_PROXY_HOPS=1 npm start
# Should show: hops: 1, setting: 1
```

## Summary

The fix ensures:
- ✅ No more `ERR_ERL_PERMISSIVE_TRUST_PROXY` errors
- ✅ Configurable trust proxy via environment variable
- ✅ Proper validation disabled in all rate limiters
- ✅ Safe IP extraction that works with or without proxy
- ✅ Startup logging for verification

