require('dotenv').config({ path: '/var/www/client/.env' });

module.exports = {
    apps: [
        {
            name: 'cofrem',
            cwd: '/var/www/client',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: "production",
                DATABASE_URL: process.env.DATABASE_URL,
                AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
                AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
                AUTH_SECRET: process.env.AUTH_SECRET,
                NEXTAUTH_URL: process.env.NEXTAUTH_URL,
                AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST
            },

            // Stability
            autorestart: true,
            max_restarts: 20,
            restart_delay: 3000,
            exp_backoff_restart_delay: 100,

            // Prevent restart loops on quick crash
            min_uptime: '30s',

            // Resource protection
            max_memory_restart: '600M',

            // Better logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            out_file: '/var/log/pm2/cofrem-out.log',
            error_file: '/var/log/pm2/cofrem-error.log',
            merge_logs: true,
        }
    ]
};