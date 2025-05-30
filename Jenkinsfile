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
                 // Run npm audit and capture results (won't fail the pipeline)
                  def auditExitCode = bat(
                      script: 'npm audit --audit-level=high --json > audit-report.json',
                      returnStatus: true  // Prevents failure on non-zero exit codes
                  )

                   // Parse the audit report
                  def auditReport = readJSON(file: 'audit-report.json')

                   // Check if vulnerabilities exist
                  if (auditReport.vulnerabilities && auditExitCode != 0) {
                    echo "=== SECURITY WARNING ==="
                    echo "High-severity vulnerabilities detected (see below)."
                    echo "Pipeline will continue, but please fix these issues."

                        // Print vulnerability details
                    auditReport.vulnerabilities.each { vuln ->
                       echo """
                            Package: ${vuln.name}  
                            Issue: ${vuln.title}  
                            Severity: ${vuln.severity}  
                            Fix: ${vuln.fix_available ? "Update to ${vuln.target_version}" : "Manual review required"}  
                            Advisory: ${vuln.url}  
                        """
                    }

                     // Mark build as unstable (optional)
                    currentBuild.result = 'UNSTABLE'
               } else {
                    echo "No high-severity vulnerabilities found."
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
