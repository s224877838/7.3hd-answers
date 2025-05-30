pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
        // Define the Package ID expected by Octopus
        OCTOPUS_PACKAGE_ID = 'My Jenku App' // <--- Keep this as is for Octopus internal use
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
                bat 'npm test'
                echo 'Test ran successfully.'
            }
        }
        stage('Code Quality') {
            steps {
                bat 'npx eslint .'
                echo 'Code quality ran successfully.'
            }
        }
        stage('Security') {
            steps {
                script {
                    bat 'npm audit --audit-level=high --json > audit-report.json || true'
                    def report = readFile('audit-report.json')
                    if (report.contains('"severity":"high"')) {
                        echo "⚠️ HIGH SEVERITY VULNERABILITIES DETECTED"
                        echo "Raw report:\n${report}"
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "✅ No high-severity vulnerabilities found"
                    }
                }
            }
        }
        stage('Deploy (Staging)') {
            steps {
                bat 'npx pm2 startOrRestart ecosystem.config.js'
                echo 'Deploy ran successfully.'
            }
        }

        stage('Package & Push to Octopus') {
            steps {
                script {
                    // --- FIX 1: Quote the package name for the zip command ---
                    // Using underscores or hyphens in package names is generally safer
                    // for command-line tools than spaces. Let's use hyphenated version for the file.
                    def safePackageFileName = "${env.OCTOPUS_PACKAGE_ID.replace(' ', '-')}.${env.BUILD_NUMBER}.zip"
                    echo "Creating package: ${safePackageFileName}"

                    // Ensure 'zip' is installed on your Jenkins agent.
                    // If you don't have 'zip', you can use '7z' or a Node.js archiving library.
                    // For example, if you have 7-Zip in your PATH:
                    // bat "7z a -tzip \"${safePackageFileName}\" ."
                    bat "zip -r \"${safePackageFileName}\" ." // Added quotes around filename

                    // 2. Push the package to Octopus Deploy
                    withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                        def octopusServer = 'https://jenku.octopus.app'
                        def packageVersion = "1.0.${env.BUILD_NUMBER}"

                        // --- FIX 2: Ensure API key is correctly passed ---
                        // Use sh for Unix-like systems, bat for Windows.
                        // Assuming Windows for now based on your path:
                        // The issue is likely that %OCTO_API% is null or empty when reaching the bat command.
                        // Let's try to explicitly echo it first for debugging, and then ensure it's not null.
                        // If it's still empty, you must check your Jenkins credential setup for 'OCTOPUS_API_KEY'.
                        bat """
                            echo "Attempting to push package with API Key (masked): %OCTO_API%"
                            if "%OCTO_API%"=="" (
                                echo "ERROR: OCTOPUS_API_KEY credential is empty or not resolving!"
                                exit 1
                            )
                            set OCTO_API_KEY_VAR=%OCTO_API% && ^
                            C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe push ^
                            --server "${octopusServer}" ^
                            --apikey "%OCTO_API_KEY_VAR%" ^
                            --package "${safePackageFileName}" ^
                            --replace-existing
                        """
                        echo "✅ Package ${safePackageFileName} pushed to Octopus"
                    }
                }
            }
        }

        stage('Monitoring & Alerting') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEWRELIC_API_KEY', variable: 'NR_API_KEY')]) {
                        bat """
                        set NR_API_KEY_VAR=%NR_API_KEY% && ^
                        curl -X GET "${env.NEW_RELIC_API_URL}" ^
                        -H "Api-Key: %NR_API_KEY_VAR%" ^
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
                                currentBuild.result = 'UNSTABLE'
                            } else {
                                echo 'No active New Relic incidents found.'
                            }
                        } else {
                            echo "ERROR: newrelic-alerts.json not found. Check curl command."
                            currentBuild.result = 'UNSTABLE'
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
                            def octopusServer = 'https://jenku.octopus.app'
                            def projectName = 'My jenku app'
                            def releaseVersion = "1.0.${env.BUILD_NUMBER}"
                            def environmentName = 'Production'

                            // --- Fix: Ensure API key is correctly passed ---
                            bat """
                                set OCTO_API_KEY_VAR=%OCTO_API% && ^
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe create-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API_KEY_VAR%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
                                --package "${env.OCTOPUS_PACKAGE_ID}:${releaseVersion}"
                            """

                            // --- Fix: Ensure API key is correctly passed ---
                            bat """
                                set OCTO_API_KEY_VAR=%OCTO_API% && ^
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe deploy-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API_KEY_VAR%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
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
    post {
        always {
            script {
                if (currentBuild.result == 'SUCCESS') {
                    emailext(
                        to: 'levinjoseph15@gmail.com',
                        subject: "Jenkins Pipeline SUCCESS: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                        body: "The Jenkins pipeline for ${env.JOB_NAME} build #${env.BUILD_NUMBER} completed successfully."
                    )
                } else if (currentBuild.result == 'UNSTABLE') {
                    emailext(
                        to: 'levinjoseph15@gmail.com',
                        subject: "Jenkins Pipeline UNSTABLE: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                        body: "The Jenkins pipeline for ${env.JOB_NAME} build #${env.BUILD_NUMBER} completed with warnings (e.g., high-severity vulnerabilities found, New Relic alerts)."
                    )
                } else if (currentBuild.result == 'FAILURE') {
                    emailext(
                        to: 'levinjoseph15@gmail.com',
                        subject: "Jenkins Pipeline FAILURE: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                        body: "The Jenkins pipeline for ${env.JOB_NAME} build #${env.BUILD_NUMBER} FAILED. Check console output for details."
                    )
                }
            }
        }
    }
}