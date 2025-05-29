// Jenkinsfile

// Define the agent where the pipeline will run
pipeline {
    agent {
        // Use a specific Jenkins agent label if you have dedicated machines
        // label 'my-node-agent'

        // Specify the Node.js toolchain configured in Jenkins
        // Go to Jenkins -> Manage Jenkins -> Global Tool Configuration -> NodeJS installations
        // Replace 'Node_20' with the exact name you gave your NodeJS installation
        tools {
            nodejs 'Node_20'
        }
    }

    // Define environment variables, especially sensitive ones using Jenkins Credentials
    environment {
        // --- Jenkins Credentials IDs for your secrets ---
        // You MUST create these in Jenkins -> Manage Jenkins -> Manage Credentials
        // Choose 'Secret text' for individual strings, or 'Secret file' if you prefer a .env file.
        // Example: 'your-jwt-secret-id' would be the ID you assign to the JWT_SECRET credential.
        
        // Backend Secrets
        JWT_SECRET_VAR = credentials('your-jwt-secret-id')             // Used by backend for JWT signing/verification
        MONGODB_URI_VAR = credentials('your-mongodb-uri-id')           // Database connection string
        EMAIL_USER_VAR = credentials('your-email-user-id')             // Email service username
        EMAIL_PASSWORD_VAR = credentials('your-email-password-id')     // Email service password

        // Frontend URL (for Socket.IO CORS origin, usually points to your frontend host)
        // This should point to your *staging* frontend URL for the staging deploy.
        FRONTEND_URL_VAR = credentials('your-frontend-url-id')

        // --- Deployment Specific Variables ---
        // Define SSH credentials for the deployment target server
        // This should be a 'Username with private key' credential type in Jenkins
        DEPLOY_SSH_CRED_ID = 'your-ssh-deployment-credential-id'

        // IP address or hostname of your staging server
        DEPLOY_SERVER_HOST = 'your.staging.server.com'

        // User on the staging server to SSH into
        DEPLOY_SERVER_USER = 'ubuntu' // Common for AWS/DigitalOcean, adjust as needed

        // Path on the remote server where your application will reside
        DEPLOY_PATH = '/var/www/global-study-share' // Choose a suitable path
    }

    // Stages of your CI/CD pipeline
    stages {
        stage('Clean Workspace & Checkout') {
            steps {
                // Cleans the Jenkins workspace directory before checking out new code
                cleanWs()
                // Checks out your code from the Git repository configured in the job
                // Replace 'main' with your primary branch name (e.g., 'master')
                // Add credentialsId if your repo is private
                git branch: 'main', credentialsId: 'your-git-credential-id', url: 'https://github.com/your-username/your-repo.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                // `npm ci` is preferred over `npm install` in CI environments
                // It ensures a clean install based on package-lock.json/yarn.lock
                sh 'npm ci'
            }
        }

        stage('Run Unit Tests') {
            steps {
                // `CI=true` often prevents interactive watch modes in test runners like Jest
                // Make sure your `package.json` has a "test" script that runs Jest.
                sh 'CI=true npm test'
            }
        }

        stage('Code Quality Check (ESLint)') {
            steps {
                // Runs ESLint against your project. Ensure ESLint is a devDependency
                // and you have a .eslintrc.js file in your project root.
                sh 'npx eslint .'
            }
        }

        stage('Run E2E Tests (Cypress)') {
            // ⭐ IMPORTANT: Cypress needs your backend server to be running.
            // This stage will start the backend temporarily, run Cypress, and then stop the backend.
            // You might need `xvfb-run` on your Jenkins agent if it doesn't have a display server.
            // Install xvfb: `sudo apt-get install xvfb` on Linux agent.

            steps {
                script {
                    def serverProcess = null
                    try {
                        // 1. Set environment variables for the backend server
                        // These are the same variables you pass to your Node.js app normally.
                        // We use the Jenkins credential variables defined in the environment block.
                        withEnv([
                            "JWT_SECRET=${env.JWT_SECRET_VAR}",
                            "MONGODB_URI=${env.MONGODB_URI_VAR}",
                            "EMAIL_USER=${env.EMAIL_USER_VAR}",
                            "EMAIL_PASSWORD=${env.EMAIL_PASSWORD_VAR}",
                            "FRONTEND_URL=${env.FRONTEND_URL_VAR}", // Ensure this matches Cypress config
                            "PORT=3001" // Use a different port for CI to avoid conflicts if needed
                        ]) {
                            // 2. Start the backend server in the background
                            // Adjust 'node server.js' if you use a build output or different start command
                            echo "Starting backend server for Cypress tests..."
                            serverProcess = sh(script: "node server.js &", returnStdout: true, returnStatus: true) // '&' runs in background

                            // Wait a bit for the server to fully start
                            sleep 10 // Adjust this duration based on your server's startup time

                            // 3. Run Cypress tests in headless mode
                            echo "Running Cypress E2E tests..."
                            // Assuming 'cypress' is installed as a devDependency in your package.json
                            // If your Cypress tests connect to localhost:3000, ensure your CI server
                            // is listening on that port or adjust Cypress baseUrl in cypress.config.js
                            // For this example, we assume backend started on 3001, so Cypress needs to be configured to hit 3001
                            sh 'npx cypress run --headless'
                        }
                    } finally {
                        // 4. Ensure the backend server is killed after tests, even if they fail
                        if (serverProcess != null) {
                            echo "Stopping backend server..."
                            // Find and kill the Node.js process started by the `node server.js &` command
                            // This might need adjustment based on how your Node process is identified.
                            sh "kill \$(lsof -t -i:3001 || true)" // Kills process on port 3001
                        }
                    }
                }
            }
            // Optional: Publish Cypress test reports
            // post {
            //     always {
            //         // If you've configured Cypress to output Junit XML reports
            //         junit 'cypress/results/*.xml'
            //     }
            // }
        }

        stage('Deploy to Staging') {
            steps {
                script {
                    // Use withCredentials to inject SSH private key into the environment
                    withCredentials([sshUserPrivateKey(credentialsId: env.DEPLOY_SSH_CRED_ID)]) {
                        echo "Deploying to staging server: ${env.DEPLOY_SERVER_HOST}"

                        // SSH command to create directory and copy files
                        // -o StrictHostKeyChecking=no is for initial connection if host key isn't known
                        // For production, you should pre-add the host key to ~/.ssh/known_hosts on the Jenkins agent
                        sh """
                            # Create the deployment directory if it doesn't exist
                            ssh -o StrictHostKeyChecking=no ${env.DEPLOY_SERVER_USER}@${env.DEPLOY_SERVER_HOST} "mkdir -p ${env.DEPLOY_PATH}"

                            # Copy all project files from Jenkins workspace to the remote server
                            # The '-r' flag is for recursive copy of directories
                            scp -o StrictHostKeyChecking=no -r ./* ${env.DEPLOY_SERVER_USER}@${env.DEPLOY_SERVER_HOST}:${env.DEPLOY_PATH}/

                            # SSH into the remote server to perform post-copy actions:
                            # 1. Change to the deployment directory
                            # 2. Install production dependencies only (npm ci --production is also an option)
                            # 3. Set environment variables for the PM2 process (important for staging)
                            # 4. Restart the PM2 process for your application
                            ssh -o StrictHostKeyChecking=no ${env.DEPLOY_SERVER_USER}@${env.DEPLOY_SERVER_HOST} "cd ${env.DEPLOY_PATH} && \\
                                npm install --production && \\
                                export JWT_SECRET=${env.JWT_SECRET_VAR} && \\
                                export MONGODB_URI=${env.MONGODB_URI_VAR} && \\
                                export EMAIL_USER=${env.EMAIL_USER_VAR} && \\
                                export EMAIL_PASSWORD=${env.EMAIL_PASSWORD_VAR} && \\
                                export FRONTEND_URL=${env.FRONTEND_URL_VAR} && \\
                                pm2 restart server.js"
                        """
                    }
                }
            }
        }
    }

    // Post-build actions
    post {
        always {
            // Clean up the workspace even if the build fails
            cleanWs()
            echo "Pipeline finished. Workspace cleaned."
        }
        success {
            echo 'Deployment to Staging successful!'
            // Add notifications here (e.g., Slack, email)
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
            // Add failure notifications here
        }
    }
}
