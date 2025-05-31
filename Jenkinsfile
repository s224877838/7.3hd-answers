pipeline {
    agent any
    environment {
        NEW_RELIC_ACCOUNT_ID = '6787357'
        NEW_RELIC_API_URL = "https://api.newrelic.com/v2/alerts_incidents.json"
    }

    stages {
        stage('Build') {
            steps {
                bat 'npm install'
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
                                    to: 'levinjoseph11@gmail.com'
                                )
                                currentBuild.result = 'UNSTABLE'
                            } else {
                                echo '✅ No active New Relic incidents found.'
                            }
                        }
                    }
                }
            }
            post {
                always {
                    emailext(
                        to: 'levinjoseph15@gmail.com',
                        subject: "Jenkins Notification: Monitoring & Alerting Complete",
                        body: "Monitoring and Alerting stage completed. Check Jenkins log or New Relic for details."
                    )
                }
            }
        }

        stage('Package and Push to Octopus') {
            steps {
                script {
                    def octopusPackageId = 'my jenku app'
                    def packageVersion = "1.0.${env.BUILD_NUMBER}"
                    def packageIdForFilename = octopusPackageId.replace(' ', '.')
                    def safePackageFileName = "${packageIdForFilename}.${packageVersion}.zip"

                    echo "Creating package: ${safePackageFileName}"

                    bat 'del /Q *.zip || true'
                    bat "zip -r \"${safePackageFileName}\" ."

                    withCredentials([string(credentialsId: 'OCTOPUS_API_KEY', variable: 'OCTO_API')]) {
                        def octopusServer = 'https://jenku.octopus.app'

                        bat """
                            C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe push ^
                            --server "${octopusServer}" ^
                            --apikey "%OCTO_API%" ^
                            --package "${safePackageFileName}" ^
                            --replace-existing
                        """
                        echo "Package ${safePackageFileName} pushed to Octopus."
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
                            def projectName = 'my jenku app'
                            def releaseVersion = "1.0.${env.BUILD_NUMBER}"
                            def environmentName = 'Production'
                            def octopusPackageId = 'My Jenku App'

                            bat """
                                C:\\Users\\Levin\\Downloads\\OctopusTools.9.0.0.win-x64\\octo.exe create-release ^
                                --server "${octopusServer}" ^
                                --apikey "%OCTO_API%" ^
                                --project "${projectName}" ^
                                --releaseNumber "${releaseVersion}" ^
                                --package "${octopusPackageId}:${releaseVersion}"
                            """
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
                        echo "✅ Production deployment triggered."
                        emailext(
                            subject: "RELEASED: ${env.JOB_NAME} v${env.BUILD_NUMBER} to production",
                            to: 'levinjoseph11@gmail.com'
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

