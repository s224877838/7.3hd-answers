pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
    }
    stages {
        stage('Build') {
            steps {
                bat 'npm install' // Installs all project dependencies.
                echo 'Build ran successfully.'
            }
        }
        stage('Test') {
            steps {
                // Runs your project's tests. Ensure your package.json has a "test" script.
                // If you don't have tests yet, you can change this to echo "No tests configured."
                bat 'npm test'
                echo 'Test ran successfully.'
            }
        }
        stage('Code Quality') {
            steps {
                // Runs ESLint for code quality checks.
                // Make sure ESLint is installed as a dev dependency (npm install eslint --save-dev)
                // and you have a .eslintrc.js config file in your project's root.
                bat 'npx eslint .'
                echo 'Code quality ran successfully.'
            }
        }
        stage('Security') {
            steps {
               script {
                // Run npm audit (always succeeds due to || true)
                    bat 'npm audit --audit-level=high --json > audit-report.json || true'
            
            // Basic vulnerability check using file contains
                     def report = readFile('audit-report.json')
                     if (report.contains('"severity":"high"')) {
                        echo "⚠️ HIGH SEVERITY VULNERABILITIES DETECTED"
                        echo "Raw report:\n${report}"
                        currentBuild.result = 'UNSTABLE' // Marks build yellow but continues
                    } else {
                        echo "✅ No high-severity vulnerabilities found"
                    }
                 }
            }
        }
        
        stage('Deploy (Staging)') {
            steps {
                // Restarts your Node.js application using PM2.
                // This assumes PM2 is installed and managing your server.js on the target server.
                // If deploying to a different server via SSH, this step would be more complex.
                bat 'npx pm2 startOrRestart ecosystem.config.js'
                echo 'Deploy ran successfully.'
            }
        }
        stage('Monitoring & Alerting') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEWRELIC_API_KEY', variable: 'NR_API_KEY')]) {
                        bat """
                        curl -X GET "${env.NEW_RELIC_API_URL}" ^
                        -H "Api-Key: %NR_API_KEY%" ^
                        -H "Accept: application/json" ^
                        -o newrelic-alerts.json
                        """

                        if (fileExists('newrelic-alerts.json')) {
                            def json = readJSON file: 'newrelic-alerts.json'
                            def activeAlerts = json?.incidents?.findAll { it?.incident_preference == 'PER_POLICY' }

                            if (activeAlerts && activeAlerts.size() > 0) {
                                emailext(
                                    subject: "New Relic ALERT: ${activeAlerts.size()} active issues",
                                    body: "Check New Relic dashboard for active alerts.",
                                    to: 'levinjoseph15@gmail.com'
                                )
                                currentBuild.result = 'UNSTABLE' // Optional: mark build as warning
                            } else {
                                echo 'No active New Relic incidents found.'
                                
                                   always{
                                       emailext(
                                           to: 'levinjoseph15@gmail.com',
                                           subject: "Jenkins Notification: No New Relic alerts",
                                           body: "The Jenkins pipeline completed successfully, and no active New Relic incidents were found."
                                       )
                                   }
                                       
                            }
                        }
                    }
                }
            }
        }
        stage('Release to Production') {
    steps {
        script {
            echo "Checking deployment prerequisites..."

            def canDeploy = input(
                message: "Promote to PRODUCTION?",
                parameters: [choice(choices: 'Yes\nNo', description: 'Confirm production release', name: 'approval')]
            )

            if (canDeploy == 'Yes') {
                withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                    def octopusServer = 'https://jenku.octopus.app' // Replace with your Octopus URL
                    def projectName = 'My jenku app' // Replace with your Octopus project
                    def releaseVersion = "1.0.${env.BUILD_NUMBER}" // Or however you're tagging
                    def environmentName = 'Production'

                    // Create a release
                    bat """
                        C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe octo create-release ^
                        --server ${octopusServer} ^
                        --apikey ${OCTO_API} ^
                        --project "${projectName}" ^
                        --releaseNumber ${releaseVersion}
                    """

                    // Deploy the release
                    bat """
                        C:\Users\Levin\Downloads\OctopusTools.9.0.0.win-x64\\octo.exe octo deploy-release ^
                        --server ${octopusServer} ^
                        --apikey ${OCTO_API} ^
                        --project "${projectName}" ^
                        --releaseNumber ${releaseVersion} ^
                        --deployTo "${environmentName}" ^
                        --progress
                    """
                }

                echo "✅ Production deployment triggered via Octopus"
                emailext (
                    subject: "RELEASED: ${env.JOB_NAME} v${env.BUILD_NUMBER} to production",
                    to: 'team@company.com'
                )
            } else {
                echo "🚫 Production release aborted"
                currentBuild.result = 'ABORTED'
            }
        }
    }
}

    }
}
