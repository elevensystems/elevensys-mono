import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui'],
  reactStrictMode: true,
  // typescript-eslint cannot load the TS 7 API yet, so `typescript` is aliased to
  // @typescript/typescript6 for tooling. That package ships bin/tsc6, not bin/tsc,
  // which Next's CLI type-check path requires, so type-check through the TS API.
  // `pnpm type-check` runs the real TS 7 compiler.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
