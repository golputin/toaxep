/** HoodAgent API — pm2 (VPS only, no static UI) */
module.exports = {
  apps: [
    {
      name: "hoodagent-api",
      cwd: "/root/openagent",
      script: "server/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        SERVE_STATIC: "0",
        PORT: "8787",
      },
      max_memory_restart: "300M",
      time: true,
    },
  ],
};
