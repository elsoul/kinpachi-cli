import fs from 'fs'

export const apiYml = async (
  envString: string,
  memory: string,
  cpu: string,
  maxConcurrency: string,
  maxInstances: string,
  minInstances: string
) => {
  fs.mkdirSync('.github/workflows', { recursive: true })
  const filePath = `.github/workflows/api.yml`
  const body = `name: Api
on:
  push:
    branches:
      - main
    paths:
      - 'apps/api/**'
      - '.github/workflows/api.yml'

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2
      - name: Install Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18.14.0'

      - name: Checkout the repository
        uses: actions/checkout@v2

      - id: auth
        uses: google-github-actions/auth@v0
        with:
          credentials_json: \${{ secrets.KINPACHI_GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v0

      - name: Build and test
        env:
          RACK_ENV: test
        run: |
          sudo apt-get -yqq install libpq-dev
          cd apps/api
          rm -f .env
          yarn install --jobs 4 --retry 3
          yarn test

      - name: Configure Docker
        run: gcloud auth configure-docker --quiet

      - name: Build Docker container
        run: docker build -f ./apps/api/Dockerfile ./apps/api -t \${{ secrets.KINPACHI_CONTAINER_REGION }}/\${{ secrets.KINPACHI_GCP_PROJECT_ID }}/kinpachi-\${{ secrets.KINPACHI_APP_NAME }}-api

      - name: Push to Container Resistory
        run: docker push \${{ secrets.KINPACHI_CONTAINER_REGION }}/\${{ secrets.KINPACHI_GCP_PROJECT_ID }}/kinpachi-\${{ secrets.KINPACHI_APP_NAME }}-api

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy kinpachi-\${{ secrets.KINPACHI_APP_NAME }}-api \\
            --service-account=\${{ secrets.KINPACHI_APP_NAME }}@\${{ secrets.KINPACHI_GCP_PROJECT_ID }}.iam.gserviceaccount.com \\
            --image=\${{ secrets.KINPACHI_CONTAINER_REGION }}/\${{ secrets.KINPACHI_GCP_PROJECT_ID }}/kinpachi-\${{ secrets.KINPACHI_APP_NAME }}-api \\
            --memory=${memory} \\
            --cpu=${cpu} \\
            --concurrency=${maxConcurrency} \\
            --max-instances=${maxInstances} \\
            --min-instances=${minInstances} \\
            --ingress=internal-and-cloud-load-balancing \\
            --no-allow-unauthenticated \\
            --execution-environment=gen2 \\
            --region=\${{ secrets.KINPACHI_GCP_REGION }} \\
            --platform=managed \\
            --quiet \\
            --port=8080 \\
            --vpc-connector="\${{ secrets.KINPACHI_APP_NAME }}-con" \\
            --vpc-egress=all \\
            --set-env-vars=${envString}
`

  return {
    filePath,
    body,
  }
}
