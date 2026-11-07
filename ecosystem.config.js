module.exports = {
  apps: [
    {
      name: "kairos-bot",
      script: "server.js",
      cwd: "./backend",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
