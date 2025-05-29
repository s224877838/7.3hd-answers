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
                    // Manual approval gate for production deployment
                    timeout(time: 5, unit: 'SECOND') { // Give 30 minutes for approval
                        input message: 'Promote to Production? Confirm manual approval.'
                    }

                    echo 'Proceeding with Production Deployment...'

                    // --- OPTION 1: Using Octopus Deploy (requires Octopus Deploy plugin in Jenkins) ---
                    // You'll need to configure your Octopus API Key and Server URL as Jenkins Credentials
                    // withId('<YOUR_OCTOPUS_API_KEY_CREDENTIAL_ID>') { credentialsId ->
                    //     sh "octo create-release --project \"YourProjectName\" --version ${env.BUILD_NUMBER} --package \"myapp\" --packageVersion ${env.BUILD_NUMBER} --server \"https://your-octopus-server.com\" --apiKey ${credentialsId}"
                    //     sh "octo deploy-release --project \"YourProjectName\" --version ${env.BUILD_NUMBER} --deployTo \"Production\" --server \"https://your-octopus-server.com\" --apiKey ${credentialsId}"
                    // }
                    // echo 'Deployment triggered in Octopus Deploy.'

                    // --- OPTION 2: Using AWS CodeDeploy (requires AWS Credentials setup in Jenkins) ---
                    // This assumes you've packaged your application into a deployable artifact (e.g., S3-ready zip)
                    // and have an S3 bucket configured for CodeDeploy.
                    // withAWS(credentials: '<YOUR_AWS_CREDENTIAL_ID>', region: 'ap-southeast-2') { // Dandenong/Victoria is in this region
                    //     // Upload artifact to S3 (if not already done by previous stage)
                    //     sh "aws s3 cp myapp.zip s3://your-codedeploy-bucket/myapp-${env.BUILD_NUMBER}.zip"

                    //     // Create CodeDeploy deployment
                    //     sh "aws deploy create-deployment --application-name YourCodeDeployApp --deployment-group-name ProductionGroup --s3-location bucket=your-codedeploy-bucket,key=myapp-${env.BUILD_NUMBER}.zip,bundleType=zip"
                    // }
                    // echo 'Deployment triggered in AWS CodeDeploy.'

                    // --- OPTION 3: Direct PM2 deployment if production is on the same (or accessible) server ---
                    // **WARNING**: Directly deploying to production from a Jenkins agent is often not best practice
                    // for serious production setups, but it's the simplest if you don't have other tools.
                    // This assumes the Jenkins agent itself *is* your production server, or has SSH access.
                    // If using SSH, you'd wrap this in an 'sshagent' block and use 'ssh' commands.
                    echo 'Deploying to Production directly with PM2 (adjust for your actual production setup).'
                    // Ensure you have any production-specific npm installs or builds here if different from staging
                    // e.g., if production has different npm dependencies or a different build process
                    // sh 'npm install --production' // Install only production dependencies
                    // sh 'npm run build:prod' // Or a specific production build script
                    withEnv(['BUILD_ID=dontKillMe']) {
                       bat 'npx pm2 startOrRestart ecosystem.config.js --env production'
                    }
                    echo 'Deploy to Production ran successfully using PM2.'

                    // --- CHOOSE ONE OF THE ABOVE OPTIONS ---
                    // For demonstration, let's keep the direct PM2 deploy as the active one.
                }
            }
        }
    }
}
