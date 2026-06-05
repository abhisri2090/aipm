import type { NextConfig } from "next";

const apiProxyOrigin = process.env.AIPM_API_PROXY_ORIGIN ?? "https://api.aipm-registry.com";
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.aipm-registry.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/v1/auth/github/start",
        destination: `${apiProxyOrigin}/v1/auth/github/start`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiProxyOrigin}/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${apiProxyOrigin}/health`,
      },
      {
        source: "/ready",
        destination: `${apiProxyOrigin}/ready`,
      },
    ];
  },
};

export default nextConfig;
