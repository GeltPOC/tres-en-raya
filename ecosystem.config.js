module.exports = {
  apps: [
    {
      name: 'tres-en-raya',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
