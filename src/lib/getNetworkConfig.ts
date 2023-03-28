import fs from 'fs'
import { createHash } from 'crypto'
import { execSync } from 'child_process'

export const KEYFILE_PATH = './keyfile.json'
export const GRAPHQL_PATH = './apps/api/src/graphql'
export const PRISMA_SCHEMA_PATH = './apps/api/prisma/schema.prisma'
export const API_PATH = './apps/api'
export const API_TYPE_PATH = API_PATH + '/src/types'
export const API_ENV_PRODUCTION_PATH = './apps/api/.env.production'
export const API_ENV_BUILD_PATH = './apps/api/.env.build'
export const WORKER_PATH = './apps/workers'
export const KINPACHI_CONFIG_PATH = './kinpachi-cloud.config.json'
export const ROUTE_PACKAGE_JSON_PATH = './package.json'
export const API_REPO_URL = 'https://github.com/elsoul/kinpachi-api'
export const FRONT_APP_REPO_URL =
  'https://github.com/elsoul/kinpachi-app-template'
export const FRONT_APP_PATH = './apps/app'

export enum WorkerPlugins {
  SOLANA_TRANSFER = 'solana-transfer',
  ORCA_SWAP = 'orca-swap',
  JUPITER_SWAP = 'jupiter-swap',
}

export const getEnvString = async (str: string) => {
  const output = str
    .replace(/-/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
  return output
}

export const genSecret = async (name: string) => {
  return createHash('sha256').update(name).digest('hex')
}

export const defaultProductionEnvArray = [
  'NO_PEER_DEPENDENCY_CHECK=1',
  'GOOGLE_CLOUD_PROJECT=${{ secrets.GOOGLE_CLOUD_PROJECT }}',
]

export const getActionsEnvString = async (filePath: string) => {
  const stream = fs.readFileSync(filePath)
  const envArray: Array<string> = String(stream).split('\n')
  let newEnv: Array<string> = []
  for await (const envLine of envArray) {
    let keyAndValue = envLine.match(/([A-Z_]+)="?([^"]*)"?/)
    if (keyAndValue) {
      const envString =
        `${keyAndValue[1]}=$` + '{{ ' + `secrets.${keyAndValue[1]}` + ' }}'
      newEnv.push(envString)
    }
  }
  const returnArray = defaultProductionEnvArray.concat(newEnv)
  return returnArray.join(',')
}

export const getBuidEnvString = async () => {
  const stream = fs.readFileSync(API_ENV_PRODUCTION_PATH)
  const envArray: Array<string> = String(stream).split('\n')
  let hash: { [key: string]: string } = {}
  for await (const line of envArray) {
    const value = line.split('=')
    hash[value[0]] = value[1]
  }
  return envArray.join(',')
}

export const getNetworkConfig = async (projectId: string, appName: string) => {
  const kinpachiHd = 'kinpachi-' + appName
  return {
    projectId,
    appName,
    cloudRunName: `kinpachi-${appName}-api`,
    instanceName: kinpachiHd + '-db',
    networkName: kinpachiHd + '-network',
    firewallTcpName: kinpachiHd + '-fw-tcp',
    firewallSshName: kinpachiHd + '-fw-ssh',
    natName: kinpachiHd + '-nat',
    routerName: kinpachiHd + '-router',
    subnetName: kinpachiHd + '-subnet',
    connectorName: appName + '-con',
    ipName: kinpachiHd + '-external-ip',
    loadBalancerIpName: kinpachiHd + '-lb-ip',
    ipRangeName: kinpachiHd + '-ip-range',
    serviceAccountName: `${appName}@${projectId}.iam.gserviceaccount.com`,
    networkEndpointGroupName: `${kinpachiHd}-neg`,
    backendServiceName: `${kinpachiHd}-bs`,
    loadBalancerName: `${kinpachiHd}-lb`,
    sslName: `${kinpachiHd}-ssl`,
    proxyName: `${kinpachiHd}-px`,
    forwardingRuleName: `${kinpachiHd}-fr`,
    zoneName: `${kinpachiHd}-zone`,
    securityPolicyName: `${kinpachiHd}-armor`,
  }
}

export const getContainerImageUrl = async (
  projectId: string,
  appName: string,
  region: string,
  workerName: string = '',
  isPlugin: boolean = false
) => {
  const cRegion = await getContainerRegion(region)

  let imageName = ''
  if (workerName !== '' && isPlugin) {
    imageName = 'kinpachi-worker-' + workerName
  } else if (workerName !== '') {
    imageName = 'kinpachi-' + appName + '-worker-' + workerName
  } else {
    imageName = 'kinpachi-' + appName + '-api'
  }

  let containerProjectName = isPlugin ? 'kinpachi-framework' : projectId
  return cRegion + '/' + containerProjectName + '/' + imageName + ':latest'
}

export const getContainerImageName = async (
  appName: string,
  workerName: string = ''
) => {
  const imageName =
    workerName !== ''
      ? 'kinpachi-' + appName + '-worker-' + workerName
      : 'kinpachi-' + appName + '-api'
  return imageName
}

export const getContainerRegion = async (region: string) => {
  switch (region) {
    case region.match('asia')?.input:
      return 'asia.gcr.io'
    case region.match('eu')?.input:
      return 'eu.gcr.io'
    default:
      return 'gcr.io'
  }
}

export const regionToTimezone = async (region: string) => {
  switch (true) {
    case region.includes('asia'):
      return 'Asia/Tokyo'
    case region.includes('europe'):
      return 'Europe/Amsterdam'
    default:
      return 'America/Los_Angeles'
  }
}

export const getRunUrl = async (projectId: string, appName: string) => {
  try {
    const runName = (await getNetworkConfig(projectId, appName)).cloudRunName
    console.log(runName)
    const cmd = `gcloud run services list --project=${projectId} | grep ${runName} | awk '{print $4}'`
    const res = String(execSync(cmd)).replace(/\r?\n/g, '')

    return res
  } catch (error) {
    return ''
  }
}
