pipeline {
    agent any // Run the pipeline on any available agent.
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
    }
    stages {
        stage('Build') {
            steps {
                bat 'npm install' // Installing  project dependencies.
                echo 'Build ran successfully.'
            }
        }
        stage('Test') {
            steps {
                // Running your project's tests. 
                
                bat 'npm test'
                echo 'Test ran successfully.'
            }
        }
        stage('Code Quality') {
            steps {
                // Running ESLint for code quality checks.
               
                bat 'npx eslint .'
                echo 'Code quality ran successfully.'
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
                        echo " No high-severity vulnerabilities found"
                    }
                 }
            }
        }
        
        stage('Deploy (Staging)') {
            steps {
                // Restarting your Node.js application using PM2.
                
                bat 'npx pm2 startOrRestart ecosystem.config.js'
                echo 'Deploy ran successfully.'
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
                                    body: "Check New Relic dashboard for active alerts.",
                                    to: 'levinjoseph15@gmail.com'
                                )
                                currentBuild.result = 'UNSTABLE' // marking build as warning
                            } else {
                                echo 'No active New Relic incidents found. Monitor and ALert stage ran successfully.'
                                
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
        stage('Package & Push to Octopus') {
            steps {
                script {
                    def octopusPackageId = 'my jenku app'
                    def packageVersion = "1.0.${env.BUILD_NUMBER}" // Version is defined here

                    //  Naming the zip file so Octopus can parse ID and Version
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
        }

    }
}
