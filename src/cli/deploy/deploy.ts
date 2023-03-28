import { execSyncCmd } from '@/lib/execSyncCmd'
import inquirer from 'inquirer'
import { setGcloudProject, syncRunUrl } from '@/cli'
import {
  getNetworkConfig,
  getContainerImageName,
  getContainerImageUrl,
  getBuidEnvString,
  API_PATH,
  WORKER_PATH,
} from '@/lib/getNetworkConfig'
import { importConfig, KinpachiCloudConfig } from '@/index'

export const deploy = async () => {
  const kinpachiConfig = await importConfig()
  await setGcloudProject(kinpachiConfig.api.projectId)
  await apiDeploy(kinpachiConfig)
  await syncRunUrl()
}

export const cloudRunDeploy = async (
  projectId: string,
  appName: string,
  region: string,
  memory: string = '1Gi',
  cpu: string = '1',
  maxConcurrency: string = '80',
  maxInstances: string = '100',
  minInstances: string = '0'
) => {
  const cloudRunName = await getContainerImageName(appName)
  const image = await getContainerImageUrl(projectId, appName, region)

  const { connectorName, serviceAccountName } = await getNetworkConfig(
    projectId,
    appName
  )
  const envString = await getBuidEnvString()
  const shCmd = [
    'gcloud',
    'run',
    'deploy',
    cloudRunName,
    '--service-account',
    serviceAccountName,
    '--image',
    image,
    '--memory',
    memory,
    '--cpu',
    cpu,
    '--concurrency',
    maxConcurrency,
    '--max-instances',
    maxInstances,
    '--min-instances',
    minInstances,
    '--region',
    region,
    '--platform=managed',
    '--quiet',
    '--vpc-connector',
    connectorName,
    '--project',
    projectId,
    '--ingress',
    'internal-and-cloud-load-balancing',
    '--no-allow-unauthenticated',
    '--execution-environment=gen2',
    '--set-env-vars',
    envString,
  ]
  await execSyncCmd(shCmd)
}

export const cloudRunBuild = async (
  appName: string,
  workerName: string = ''
) => {
  const buildPath =
    workerName === '' ? API_PATH : `${WORKER_PATH}/${workerName}`
  const imageName = await getContainerImageName(appName)
  const shCmd = [
    'docker',
    'build',
    '--platform',
    'linux/amd64',
    '-f',
    `${buildPath}/Dockerfile`,
    buildPath,
    '-t',
    imageName,
  ]
  execSyncCmd(shCmd)
}

export const cloudRunPush = async (
  projectId: string,
  appName: string,
  region: string
) => {
  const imageUrl = await getContainerImageUrl(projectId, appName, region)
  const shCmd = ['docker', 'push', imageUrl]
  execSyncCmd(shCmd)
}

export const cloudRunTag = async (
  projectId: string,
  appName: string,
  region: string
) => {
  const imageName = await getContainerImageName(appName)
  const imageUrl = await getContainerImageUrl(projectId, appName, region)
  const shCmd = ['docker', 'tag', imageName, imageUrl]
  execSyncCmd(shCmd)
}

export const apiDeploy = async (kinpachiConfig: KinpachiCloudConfig) => {
  await cloudRunBuild(kinpachiConfig.api.appName)
  await cloudRunTag(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName,
    kinpachiConfig.api.region
  )
  await cloudRunPush(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName,
    kinpachiConfig.api.region
  )
  await cloudRunDeploy(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName,
    kinpachiConfig.api.region,
    kinpachiConfig.api.cloudRun.memory,
    String(kinpachiConfig.api.cloudRun.cpu),
    String(kinpachiConfig.api.cloudRun.maxConcurrency),
    String(kinpachiConfig.api.cloudRun.maxInstances),
    String(kinpachiConfig.api.cloudRun.minInstances)
  )
}
