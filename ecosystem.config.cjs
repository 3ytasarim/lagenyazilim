/**
 * PM2 süreç tanımı. Deploy betiği `pm2 startOrReload ecosystem.config.cjs --update-env` ile kullanır.
 * cwd her zaman "current" sembolik bağlantısıdır; reload yeni sürüme geçer.
 * Uygulama yalnızca 127.0.0.1'e bağlanır — dış dünyaya Nginx üzerinden açılır.
 */
const BASE = process.env.LAGEN_BASE ?? "/var/www/lagen";

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME ?? "lagen-web",
      cwd: `${BASE}/current`,
      script: "node_modules/next/dist/bin/next",
      args: `start -H 127.0.0.1 -p ${process.env.PORT ?? 3490}`,
      exec_mode: "cluster",
      instances: Number(process.env.PM2_INSTANCES ?? 2),
      max_memory_restart: "700M",
      kill_timeout: 10000,
      listen_timeout: 15000,
      env: {
        NODE_ENV: "production",
        UV_THREADPOOL_SIZE: "8",
      },
      out_file: `${BASE}/logs/web.out.log`,
      error_file: `${BASE}/logs/web.err.log`,
      merge_logs: true,
      time: true,
    },
  ],
};
