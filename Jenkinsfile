pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.
    stages {
        stage('Build') {
            steps {
                sh 'npm install' // Installs all project dependencies.
            }
        }
        stage('Test') {
            steps {
                // Runs your project's tests. Ensure your package.json has a "test" script.
                // If you don't have tests yet, you can change this to `echo "No tests configured."`
                sh 'npm test'
            }
        }
        stage('Code Quality') {
            steps {
                // Runs ESLint for code quality checks.
                // Make sure ESLint is installed as a dev dependency (`npm install eslint --save-dev`)
                // and you have a .eslintrc.js config file in your project's root.
                sh 'npx eslint .'
            }
        }
        stage('Deploy (Staging)') {
            steps {
                // Restarts your Node.js application using PM2.
                // This assumes PM2 is installed and managing your server.js on the target server.
                // If deploying to a different server via SSH, this step would be more complex.
                sh 'pm2 restart server.js'
            }
        }
    }
}
