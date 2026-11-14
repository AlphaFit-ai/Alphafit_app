// Pull request pipeline for the AlphaFit mobile app.
//
//   every branch and pull request : install, typecheck, lint, test, format check, bundle check
//
// There is no image build and no manifest update: the app is not a service. Builds for the stores and
// for testers are made by EAS (`npm run build:preview:android`, `eas build --profile production`), which
// is started by hand or from the EAS dashboard. This pipeline only says whether a change is safe to merge.
//
// The Node image is pinned; the version matches the one the app is developed with (see README).
pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins-pipeline: alphafit-mobile
spec:
  containers:
    - name: node
      image: node:24.18.0-bookworm
      command: ["cat"]
      tty: true
      resources:
        requests: { cpu: 500m, memory: 1Gi }
        limits: { cpu: "2", memory: 3Gi }
'''
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        CI                    = 'true'
        EXPO_NO_TELEMETRY     = '1'
        NPM_CONFIG_FUND       = 'false'
        NPM_CONFIG_AUDIT      = 'false'
        // The build must not depend on a developer's local .env: the default api (production) is used.
        EXPO_PUBLIC_API_URL   = ''
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                container('node') {
                    sh 'node --version && npm --version'
                    // Exactly what package-lock.json says; fails if the lock file and package.json disagree.
                    sh 'npm ci'
                }
            }
        }

        stage('Typecheck') {
            steps {
                container('node') {
                    sh 'npm run typecheck'
                }
            }
        }

        stage('Lint') {
            steps {
                container('node') {
                    // Fails on any warning, not only on errors.
                    sh 'npm run lint'
                }
            }
        }

        stage('Test') {
            steps {
                container('node') {
                    // Includes the translation audit (scripts/check-i18n.js, run by __tests__/locales.test.ts).
                    sh 'npm run test:ci'
                }
            }
        }

        stage('Format') {
            steps {
                container('node') {
                    // Prettier is checked on the files this branch changed (see scripts/format-changed.js).
                    sh '''
                        set -eu
                        git config --global --add safe.directory "$WORKSPACE"
                        base="${CHANGE_TARGET:-main}"
                        git fetch --no-tags origin "+refs/heads/${base}:refs/remotes/origin/${base}"
                        FORMAT_BASE="origin/${base}" npm run format:check
                    '''
                }
            }
        }

        stage('Bundle check') {
            steps {
                container('node') {
                    // Proves the JavaScript bundle builds. The output goes to a temporary folder, not the workspace.
                    sh '''
                        set -eu
                        out="$(mktemp -d)"
                        npx expo export --platform android --output-dir "$out"
                        rm -rf "$out"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pull request checks passed.'
        }
        failure {
            echo 'Pull request checks failed: see the failing stage above.'
        }
    }
}
