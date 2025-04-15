const helmet = require('helmet');

function setupSecurityHeaders() {
  // Define your Content Security Policy directives here
  // THIS IS A VERY STRICT EXAMPLE - Adjust based on your actual frontend needs
  const cspDirectives = {
    directives: {
      defaultSrc: ["'self'"], // Only allow resources from the same origin
      scriptSrc: ["'self'"], // Allow scripts from self - NEEDS ADJUSTMENT FOR FRAMEWORKS/CDNs
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow styles from self + inline styles - Review 'unsafe-inline'
      imgSrc: ["'self'", "data:"], // Allow images from self and data URIs
      fontSrc: ["'self'"], // Allow fonts from self
      objectSrc: ["'none'"], // Disallow plugins (Flash etc.)
      frameAncestors: ["'none'"], // Disallow embedding in iframes
      formAction: ["'self'"], // Allow forms to submit to self
      // upgradeInsecureRequests: [], // Uncomment in production if needed
    },
  };

  return [
    helmet.contentSecurityPolicy(cspDirectives),
    helmet.strictTransportSecurity({
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true, // Consider submitting to HSTS preload list after confirming stability
    }),
    helmet.xContentTypeOptions(),
    helmet.xFrameOptions({ action: 'deny' }),
    helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }),
    // Add other helmet middleware as needed (hiding powered-by etc. is often default)
  ];
}

module.exports = setupSecurityHeaders;