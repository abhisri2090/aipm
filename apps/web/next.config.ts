import type { NextConfig } from "next";

const repoRoot = new URL("../..", import.meta.url).pathname;
const apiProxyOrigin = process.env.AIPM_API_PROXY_ORIGIN ?? "https://api.aipm-registry.com";
const isDev = process.env.NODE_ENV !== "production";

function contentSecurityPolicy(): string {
  // Next.js dev bundles use eval for HMR/source maps; production stays strict.
  const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";
  const connectSrc = isDev
    ? "'self' http://127.0.0.1:8080 http://localhost:8080 https://api.aipm-registry.com ws: wss:"
    : "'self' https://api.aipm-registry.com";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

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
    value: contentSecurityPolicy(),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
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
      {
        source: "/internal",
        destination: "/admin",
        permanent: true,
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
