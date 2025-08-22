# Security Configuration for DesignTools

## Content Security Policy (CSP)

Add this to your HTML files or server configuration:

```html
<meta http-equiv=\"Content-Security-Policy\" content=\"
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  connect-src 'self' https://*.supabase.co;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
\">
```

## Security Headers

### For Cloudflare Workers (Optional)
```javascript
// Add this as a Cloudflare Worker for additional security
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  // Add security headers
  newResponse.headers.set('X-Frame-Options', 'DENY')
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('X-XSS-Protection', '1; mode=block')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return newResponse
}
```

### For Cloudflare Transform Rules
```
Field: HTTP Response Header Name
Operator: equals
Value: X-Frame-Options
Then: Set static
Value: DENY
```

## Environment Variables

For sensitive configuration, consider using environment variables:

```javascript
// For production deployment
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE'
};
```

## SSL/TLS Configuration

### Minimum TLS Version: 1.2
### HSTS Header: max-age=31536000; includeSubDomains; preload
### Certificate: Let's Encrypt (automatic with Cloudflare)

## Rate Limiting

Consider implementing rate limiting for:
- Form submissions
- File uploads
- API requests

## Additional Security Measures

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update CDN versions regularly

2. **Input Validation**
   - Sanitize all user inputs
   - Validate file types and sizes
   - Implement client and server-side validation

3. **Error Handling**
   - Don't expose sensitive error information
   - Log errors securely
   - Implement proper error pages

4. **Monitoring**
   - Set up security monitoring
   - Monitor for suspicious activity
   - Implement alerting for security events