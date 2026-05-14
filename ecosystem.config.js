module.exports = {
  apps: [{
    name: 'tres-en-raya',
    script: 'npm',
    args: 'start',
    cwd: '/home/gelt/apps/tres-en-raya',
    env: {
      NODE_ENV: 'production',
      PORT: 3750,
    },
  }],
}
