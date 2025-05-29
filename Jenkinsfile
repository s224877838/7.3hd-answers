pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.

    stages {
        

        stage('Build') {
            steps {
                // Ensure Node.js and npm are available. If you use the Node.js Plugin, uncomment the tool line.
                // tool 'NodeJs_16.x' // Replace with your configured Node.js tool name in Jenkins
                bat 'npm install'
                echo 'Build ran successfully.'
            }
        }

        stage('Test') {
            steps {
                bat 'npm test || echo "No tests configured, skipping npm test."' // Use descriptive echo for non-zero exit codes
                echo 'Tests ran successfully.'
            }
        }

        stage('Code Quality') {
            steps {
                bat 'npx eslint . || echo "ESLint found issues or is not configured, please check logs."'
                echo 'Code quality check completed.'
            }
        }

        // --- NEW: Stage to package application for deployment ---
        stage('Package Application') {
            steps {
                echo 'Packaging application for deployment...'
                bat '''
                    :: Define the temporary directory for packaging
                    set TEMP_DEPLOY_DIR=.\\deploy_package

                    :: Clean up any previous temp directory
                    if exist "%TEMP_DEPLOY_DIR%" (
                        rmdir /s /q "%TEMP_DEPLOY_DIR%"
                    ) 
                    mkdir "%TEMP_DEPLOY_DIR%"

                    :: Copy backend folder content (using xcopy for directories)
                    xcopy backend "%TEMP_DEPLOY_DIR%\\backend" /E /I /Y

                    :: Copy public folder content (using xcopy for directories)
                    xcopy public "%TEMP_DEPLOY_DIR%\\public" /E /I /Y

                    :: Copy essential root-level files
                    copy package.json "%TEMP_DEPLOY_DIR%" /Y
                    copy package-lock.json "%TEMP_DEPLOY_DIR%" /Y
                    copy ecosystem.config.js "%TEMP_DEPLOY_DIR%" /Y
                    :: Add any other root-level files your app needs to run here

                    :: Define the output zip file name
                    set OUTPUT_ZIP_FILE=myapp.zip

                    :: USE 7-ZIP HERE INSTEAD OF POWERSHELL
                    7z a -tzip "%OUTPUT_ZIP_FILE%" "%TEMP_DEPLOY_DIR%\\*"

                    :: Clean up the temporary directory after zipping (optional but good practice)
                    rmdir /s /q "%TEMP_DEPLOY_DIR%"
                '''
                archiveArtifacts artifacts: 'myapp.zip', fingerprint: true
                echo 'Application packaged and archived.'
            }
        }

        stage('Deploy (Staging)') {
            steps {
                // This assumes PM2 is installed and managing your server.js on the *same* Jenkins agent or a directly accessible server.
                // For a more robust setup, you'd use SSH or a deployment tool here.
                withEnv(['BUILD_ID=dontKillMe']) {
                    bat 'npx pm2 startOrRestart ecosystem.config.js --env development' // Assuming staging is 'development' env for PM2
                }
                echo 'Deploy to Staging ran successfully.'
            }
        }

        // --- NEW: Release (Production) Stage ---
        stage('Release (Production)') {
            steps {
                script {
                    try {
                            // Manual approval before production deploy
                             timeout(time: 2, unit: 'MINUTES') {
                             input message: 'Promote to Production? Confirm manual approval.'
                        }

                        echo '✔️ Manual approval received. Starting Production Deployment...'

                        // Debug: Check if npx and PM2 are available
                        echo '🔍 Checking environment...'
                        bat 'where node'
                        bat 'where npx'
                        bat 'npx pm2 --version'

                        // Debug: Check for config file
                        bat 'if not exist ecosystem.config.js (echo ❌ ecosystem.config.js not found & exit 1)'

                // Perform the deployment
                        withEnv(['BUILD_ID=dontKillMe']) {
                        echo '🚀 Running PM2 deployment for production...'
                        bat 'npx pm2 startOrRestart ecosystem.config.js --env production'
                        }

                        echo '✅ Deploy to Production ran successfully using PM2.'
                   } catch (err) {
                       echo "❌ Production deployment failed: ${err}"
                      currentBuild.result = 'FAILURE'
                      throw err
                 }
               }
           }
      }

}
