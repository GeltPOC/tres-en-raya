import type { NextConfig } from 'next'
const config: NextConfig = {
  basePath: '/tres-en-raya',
  webpack: (config) => {
    config.externals = [...(config.externals || []), { bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' }]
    return config
  }
}
export default config
