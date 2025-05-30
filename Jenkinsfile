pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent.
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
        stage('Monitoring & Alerting') {
           steps {
              script {
                   withCredentials([string(credentialsId: 'NEWRELIC_API_KEY', variable: 'NR_KEY']) {
                      // Get open violations from New Relic using PowerShell
                      bat """
                          @echo off
                          curl.exe -s -X GET "https://api.newrelic.com/v2/alerts_violations.json?only_open=true" ^
                          -H "X-Api-Key:%NR_KEY%" ^
                          -o newrelic-report.json || echo Continuing despite curl error
                      """
                
                      // Check if violations exist
                      if (fileExists('newrelic-report.json')) {
                          def report = readJSON file: 'newrelic-report.json'
                    
                          if (report.violations?.size() > 0) {
                             echo "🚨 ${report.violations.size()} ACTIVE ALERTS DETECTED"
                        
                             // Send formatted email alert
                             emailext (
                                 subject: "PRODUCTION ALERT: ${report.violations.size()} issues in ${env.JOB_NAME}",
                                 body: """
                                      <h2>New Relic Production Alerts</h2>
                                      <p><b>Build:</b> <a href="${env.BUILD_URL}">${env.JOB_NAME} #${env.BUILD_NUMBER}</a></p>
                                      <h3>Active Violations:</h3>
                                      <ul>
                                      ${report.violations.collect { violation ->
                                         "<li><b>${violation.policy_name}</b>: ${violation.condition_name} (${violation.severity})</li>"
                                      }.join('\n')}
                                      </ul>
                                      <p>Investigate immediately in <a href="https://one.newrelic.com">New Relic</a></p>
                                   """,
                                   to: 's224877838@deakin.edu.au',
                                   mimeType: 'text/html'
                                )
                        
                                 // Optional: Fail the stage if violations found
                                 currentBuild.result = 'UNSTABLE'
                             } else {
                                 echo "✅ No active alerts in New Relic"
                            }
                        }
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
    }
}
