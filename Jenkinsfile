pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins-pipeline: alphafit-app
spec:
  containers:
  - name: node
    image: node:18-alpine
    command:
    - cat
    tty: true
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    command:
    - cat
    tty: true
    volumeMounts:
      - name: kaniko-secret
        mountPath: /kaniko/.docker
  volumes:
    - name: kaniko-secret
      emptyDir: {}
'''
        }
    }
    
    environment {
        // --- CONFIGURATION ---
        HARBOR_URL = 'harbor.yassir-amraoui.com'
        PROJECT_NAME = 'alphafit'
        IMAGE_NAME = 'alphafit-app'
        
        // Git Repo where K8s YAMLs are stored
        MANIFEST_REPO_URL = 'https://github.com/AlphaFit-ai/Alphafit-manifests.git'
        MANIFEST_FILE_PATH = 'app/deployment.yaml' // Path inside the manifest repo
        
        // Credentials IDs from Jenkins
        HARBOR_CREDS_ID = 'harbor-creds'
        GIT_CREDS_ID = 'Github'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Web App') {
            steps {
                container('node') {
                    dir('AlphaFit_app') {
                        sh '''
                            npm ci
                            npm run build:web
                        '''
                    }
                }
            }
        }
        
        stage('Build & Push Image') {
            steps {
                container('kaniko') {
                    script {
                        echo "Building and Pushing with Kaniko..."
                        withCredentials([usernamePassword(credentialsId: HARBOR_CREDS_ID, usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
                            sh """
                                # Create Docker Config for Kaniko
                                echo \"{\\\\\"auths\\\\\": { \\\\\"https://${HARBOR_URL}\\\\\": { \\\\\"username\\\\\": \\\\\"\\$HARBOR_USER\\\\\", \\\\\"password\\\\\": \\\\\"\\$HARBOR_PASS\\\\\" } } }\" > /kaniko/.docker/config.json
                                
                                # Run Kaniko Executor
                                /kaniko/executor \\
                                  --context `pwd`/AlphaFit_app \\
                                  --dockerfile Dockerfile.web \\
                                  --destination ${HARBOR_URL}/${PROJECT_NAME}/${IMAGE_NAME}:${BUILD_NUMBER} \\
                                  --destination ${HARBOR_URL}/${PROJECT_NAME}/${IMAGE_NAME}:latest \\
                                  --skip-tls-verify
                            """
                        }
                    }
                }
            }
        }
        
        stage('Update Manifests') {
            steps {
                container('node') { // Use node container for git (it has git)
                    script {
                        echo "Updating Kubernetes Manifests..."
                        
                        withCredentials([usernamePassword(credentialsId: GIT_CREDS_ID, usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                            sh """
                                # Clone the manifest repository using HTTP credentials
                                rm -rf manifests
                                git clone https://${GIT_USER}:${GIT_PASS}@github.com/AlphaFit-ai/Alphafit-manifests.git manifests
                                cd manifests
                                
                                # Configure Git
                                git config user.email "alphafit.ai.app@gmail.com"
                                git config user.name "alpha-fit"
                                
                                # Update the image tag in deployment.yaml using sed
                                sed -i 's|image: ${HARBOR_URL}/${PROJECT_NAME}/${IMAGE_NAME}:.*|image: ${HARBOR_URL}/${PROJECT_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}|' ${MANIFEST_FILE_PATH}
                                
                                # Check if there are changes
                                if git diff --quiet; then
                                    echo "No changes to commit."
                                else
                                    git add ${MANIFEST_FILE_PATH}
                                    git commit -m "Update app to version ${BUILD_NUMBER}"
                                    git push origin main
                                fi
                            """
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo "Cleaning up..."
        }
        success {
            echo "Pipeline successfully completed. ArgoCD should sync soon."
        }
        failure {
            echo "Pipeline failed."
        }
    }
}
