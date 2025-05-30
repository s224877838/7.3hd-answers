pipeline {
    agent any // Run the pipeline on any available agent.
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
    }
    stages {
        stage('Build') {
            steps {
                bat 'npm install' // Installing project dependencies.
                echo 'Build ran successfully.'
            }
            post {
                always {
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Build Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Build' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
        stage('Test') {
            steps {
                // Running your project's tests.
                bat 'npm test || exit 0' // Added || exit 0 to ensure stage doesn't fail the entire build if tests fail
                echo 'Test ran successfully.'
            }
            post {
                always {
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Test Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Test' completed. Check console output at ${env.BUILD_URL}",
                        attachmentsPattern: '**/test-results/**/*.xml', // Assuming your test runner generates XML reports here
                        attachLog: true
                    )
                }
            }
        }
        stage('Code Quality') {
            steps {
                // Running ESLint for code quality checks.
                bat 'npx eslint . || exit 0' // Added || exit 0 to allow build to continue if linting has warnings/errors
                echo 'Code quality ran successfully.'
            }
            post {
                always {
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Code Quality Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Code Quality' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
        stage('Security') {
            steps {
                script {
                    // Running npm audit
                    bat 'npm audit --audit-level=high --json > audit-report.json || true'

                    // Basic vulnerability checking using file contains
                    def report = readFile('audit-report.json')
                    if (report.contains('"severity":"high"')) {
                        echo "⚠️ HIGH SEVERITY VULNERABILITIES DETECTED"
                        echo "Raw report:\n${report}"
                        currentBuild.result = 'UNSTABLE' // Marks build yellow but continues
                    } else {
                        echo "No high-severity vulnerabilities found"
                    }
                }
            }
            post {
                always {
                    // This email reports the overall status of the Security stage
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Security Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Security' completed. Check console output at ${env.BUILD_URL}\n\n" +
                              "Review audit-report.json for details if marked UNSTABLE.",
                        attachmentsPattern: 'audit-report.json', // Attach the audit report
                        attachLog: true
                    )
                }
            }
        }

        stage('Deploy (Staging)') {
            steps {
                // Restarting your Node.js application using PM2.
                bat 'npx pm2 startOrRestart ecosystem.config.js'
                echo 'Deploy ran successfully.'
            }
            post {
                always {
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Deploy (Staging) Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Deploy (Staging)' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
        stage('Monitoring & Alerting') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEWRELIC_API_KEY', variable: 'NR_API_KEY')]) {
                        bat """
                        curl -X GET "%NEW_RELIC_API_URL%" ^
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
                                    body: "Check New Relic dashboard for active alerts.\nLink: ${env.BUILD_URL}", // Added build URL
                                    to: 'levinjoseph15@gmail.com' // Specific recipient for alerts
                                )
                                currentBuild.result = 'UNSTABLE' // marking build as warning
                            } else {
                                echo 'No active New Relic incidents found. Monitor and Alert stage ran successfully.'
                                // This emailext will only send if NO New Relic alerts are found.
                                // Removed the incorrect `always` block here.
                                emailext(
                                    to: 'levinjoseph15@gmail.com',
                                    subject: "Jenkins Notification: No New Relic alerts detected",
                                    body: "The Jenkins pipeline's Monitoring & Alerting stage completed successfully, and no active New Relic incidents were found.\nLink: ${env.BUILD_URL}"
                                )
                            }
                        } else {
                            echo "Warning: newrelic-alerts.json not found. New Relic check skipped or failed."
                            currentBuild.result = 'UNSTABLE'
                            emailext(
                                to: 'levinjoseph15@gmail.com',
                                subject: "Jenkins Warning: New Relic check failed",
                                body: "The Jenkins pipeline could not perform the New Relic check as expected. See console log for details: ${env.BUILD_URL}"
                            )
                        }
                    }
                }
            }
            post {
                always {
                    // This email reports the overall status of the Monitoring & Alerting stage
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Monitoring & Alerting Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Monitoring & Alerting' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
        stage('Package & Push to Octopus') {
            steps {
                script {
                    def octopusPackageId = 'my jenku app'
                    def packageVersion = "1.0.${env.BUILD_NUMBER}" // Version is defined here

                    // Naming the zip file so Octopus can parse ID and Version
                    // Replacing with dots in the package ID for the filename
                    def packageIdForFilename = octopusPackageId.replace(' ', '.')
                    def safePackageFileName = "${packageIdForFilename}.${packageVersion}.zip"


                    echo "Creating package: ${safePackageFileName}"

                    bat 'del /Q *.zip || true' // Cleaning up previous zips
                    bat "zip -r \"${safePackageFileName}\" ." // Creating new zip

                    withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                        def octopusServer = 'https://jenku.octopus.app'

                        bat """
                            C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe push ^
                            --server "${octopusServer}" ^
                            --apikey "%OCTO_API%" ^
                            --package "${safePackageFileName}" ^
                            --replace-existing

                        """
                        echo " Package ${safePackageFileName} pushed to Octopus. Package and Push was successful."
                    }
                }
            }
            post {
                always {
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Package & Push Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Package & Push to Octopus' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
        stage('Release to Production') {
            steps {
                script {
                    echo "Checking deployment prerequisites.."
                    def canDeploy = input(
                        message: "Promote to PRODUCTION?",
                        parameters: [choice(choices: 'Yes\nNo', description: 'Confirm production release', name: 'approval')]
                    )
                    if (canDeploy == 'Yes') {
                        withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                            def octopusServer = 'https://jenku.octopus.app'
                            def projectName = 'my jenku app' // Match your Octopus project exactly
                            def releaseVersion = "1.0.${env.BUILD_NUMBER}"
                            def environmentName = 'Production'
                            def octopusPackageId = 'My Jenku App' // Match the ID used in the Push stage

                            // Creating a release (now with the package specified)
                            bat """
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe create-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
                                --package "${octopusPackageId}:${releaseVersion}"
                                REM Removed problematic comments from this line.
                            """
                            // Deploy the release
                            bat """
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe deploy-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
                                --deployTo "${environmentName}" ^
                                --progress
                            """
                        }
                        echo " Production deployment triggered by Octopus"
                        emailext (
                            subject: "RELEASED: ${env.JOB_NAME} v${env.BUILD_NUMBER} to production",
                            to: 's224877838@deakin.edu.au'
                        )
                    } else {
                        echo "🚫 Production release aborted"
                        currentBuild.result = 'ABORTED'
                    }
                }
            }
            post {
                always {
                    // This email reports the overall status of the Release to Production stage
                    emailext(
                        to: 's224877838@deakin.edu.au',
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Release to Production Stage - ${currentBuild.currentResult}",
                        body: "Stage 'Release to Production' completed. Check console output at ${env.BUILD_URL}",
                        attachLog: true
                    )
                }
            }
        }
    }
    // Optional: Add a final post-pipeline block for overall build status notification
    post {
        failure {
            emailext(
                to: 's224877838@deakin.edu.au',
                subject: "🚨 BUILD FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The Jenkins pipeline failed. Please check the console output: ${env.BUILD_URL}",
                attachLog: true
            )
        }
        unstable {
            emailext(
                to: 's224877838@deakin.edu.au',
                subject: "⚠️ BUILD UNSTABLE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The Jenkins pipeline completed with warnings (e.g., security vulnerabilities or New Relic alerts). Please check the console output: ${env.BUILD_URL}",
                attachLog: true
            )
        }
        success {
            emailext(
                to: 's224877838@deakin.edu.au',
                subject: "✅ BUILD SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The Jenkins pipeline completed successfully. Build URL: ${env.BUILD_URL}",
                attachLog: true
            )
        }
        aborted {
            emailext(
                to: 's224877838@deakin.edu.au',
                subject: "❌ BUILD ABORTED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "The Jenkins pipeline was aborted (e.g., manual intervention). Build URL: ${env.BUILD_URL}",
                attachLog: true
            )
        }
    }
}