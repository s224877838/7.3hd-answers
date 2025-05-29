module.exports = {
  apps : [{
    name: 'Global-Study-Share-Platform', // Give your application a name
    script: 'backend/server.js', // Or app.js, index.js - the entry point of your Node.js application
    instances: 1, // Number of instances to run (can be 'max' for all CPU cores)
    autorestart: true,
    watch: false, // Set to true for development, false for production to avoid restarts on file changes
    max_memory_restart: '1G', // Restart if memory usage exceeds this limit
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000 // Example: Specify a port for production
    }
  }]
};