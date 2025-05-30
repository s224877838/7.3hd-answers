pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
        // Define the Package ID expected by Octopus
        OCTOPUS_PACKAGE_ID = 'My Jenku App' // <--- Define your Octopus Package ID here
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

        // --- NEW STAGE ADDED ---
        stage('Package & Push to Octopus') {
            steps {
                script {
                    // You might need a build step here if your production artifacts are not in the root
                    // Example: bat 'npm run build'

                    // 1. Create the package artifact (e.g., a zip file)
                    //    Make sure 'zip' or '7z' is available on your Jenkins agent.
                    //    This example zips the entire current directory. Adjust as needed.
                    def packageFileName = "${env.OCTOPUS_PACKAGE_ID}.${env.BUILD_NUMBER}.zip"
                    echo "Creating package: ${packageFileName}"
                    // This assumes your deployable files are in the current working directory.
                    // If your build outputs to a 'dist' folder, you might do: bat 'zip -r %packageFileName% dist'
                    bat "zip -r ${packageFileName} ."

                    // 2. Push the package to Octopus Deploy
                    withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                        def octopusServer = 'https://jenku.octopus.app'
                        def packageVersion = "1.0.${env.BUILD_NUMBER}" // Match your desired release version

                        // Security best practice: Pass API key as an environment variable to bat command
                        bat """
                            set OCTO_API_KEY_VAR=%OCTO_API% && ^
                            C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe push ^
                            --server "${octopusServer}" ^
                            --apikey "%OCTO_API_KEY_VAR%" ^
                            --package "${packageFileName}" ^
                            --replace-existing
                        """
                        echo "✅ Package ${packageFileName} pushed to Octopus"
                    }
                }
            }
        }
        // --- END NEW STAGE ---

        stage('Monitoring & Alerting') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'NEWRELIC_API_KEY', variable: 'NR_API_KEY')]) {
                        // Security best practice: Pass API key as an environment variable to bat command
                        bat """
                        set NR_API_KEY_VAR=%NR_API_KEY% && ^
                        curl -X GET "${env.NEW_RELIC_API_URL}" ^
                        -H "Api-Key: %NR_API_KEY_VAR%" ^
                        -H "Accept: application/json" ^
                        -o newrelic-alerts.json
                        """

                        if (fileExists('newrelic-alerts.json')) {
                            def json = readJSON file: 'newrelic-alerts.json'
                            // incident_preference 'PER_POLICY' is for incidents that are currently active and being managed by a policy
                            // You might also want to check 'state' if available (e.g., 'open', 'acknowledged') depending on API version
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

                                // This 'always' block is inside the 'else' and won't always run.
                                // It should be outside the 'if/else' or in a separate 'post' section
                                // if you want an email always sent at the end of the stage.
                                // For now, I'll keep it as is, but advise caution.
                                // always{
                                //     emailext(
                                //         to: 'levinjoseph15@gmail.com',
                                //         subject: "Jenkins Notification: No New Relic alerts",
                                //         body: "The Jenkins pipeline completed successfully, and no active New Relic incidents were found."
                                //     )
                                // }
                            }
                        } else {
                            echo "ERROR: newrelic-alerts.json not found. Check curl command."
                            currentBuild.result = 'UNSTABLE' // Indicate a problem fetching alerts
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

                            // Create a release
                            // IMPORTANT: Added --package argument with the correct Package ID and version
                            // Security best practice: Pass API key as an environment variable to bat command
                            bat """
                                set OCTO_API_KEY_VAR=%OCTO_API% && ^
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe create-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API_KEY_VAR%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
                                --package "${env.OCTOPUS_PACKAGE_ID}:${releaseVersion}" // <--- THIS IS THE KEY CHANGE
                            """

                            // Deploy the release
                            // Security best practice: Pass API key as an environment variable to bat command
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
                            to: 'team@company.com' // Consider changing this to a real team email
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
        // This 'always' block ensures an email is sent regardless of success or failure
        // for the overall pipeline, or you can use it for specific stages.
        // I've moved the "No New Relic alerts" email here for broader context.
        always {
            script {
                // Example of how you might send a summary email at the end
                if (currentBuild.result == 'SUCCESS') {
                    emailext(
                        to: 'levinjoseph15@gmail.com', // Your email
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