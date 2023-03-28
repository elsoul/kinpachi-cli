import inquirer from 'inquirer'
import { Logger } from '@/lib/logger'
import { API_ENV_PRODUCTION_PATH } from '@/lib/getNetworkConfig'
import { importConfig, KinpachiCloudConfig } from '@/index'
import {
  initArmor,
  cloudRunBuild,
  cloudRunDeploy,
  cloudRunPush,
  cloudRunTag,
  setupGcp,
  setupLoadBalancer,
  setGcloudProject,
  gitInit,
  gitCryptInit,
  gitCommit,
  createGitRepo,
  setupActions,
  addEnvSync,
  syncRunUrl,
  syncArmor,
  getZone,
} from '@/cli'

const requireRepoName = (value: string) => {
  if (/.+\/.+/.test(value)) {
    return true
  }

  return 'This is not GitHub Repo Name!It must be repoOwner/repoName'
}

const requireDomainName = (value: string) => {
  if (/.+\..+/.test(value)) {
    return true
  }

  return 'This is not Domain Name!It must be example.com'
}

const questions = [
  {
    type: 'input',
    name: 'githubRepo',
    message: "What's your GitHub Repo Name",
    validate: requireRepoName,
    default() {
      return 'elsoul/kinpachi-api'
    },
  },
  {
    type: 'input',
    name: 'nsDomain',
    message: "What's your domain address for NameServer",
    validate: requireDomainName,
    default() {
      return 'kinpachi.dev'
    },
  },
  {
    type: 'input',
    name: 'apiDomain',
    message: "What's your domain address for API Server",
    validate: requireDomainName,
    default() {
      return 'api.kinpachi.dev'
    },
  },
]

export const init = async () => {
  const kinpachiConfig = await importConfig()
  inquirer.prompt(questions).then(async (answer) => {
    const answers = JSON.parse(JSON.stringify(answer))
    await setupCloud(kinpachiConfig, answers.githubRepo)
    await setupLoadBalancer(kinpachiConfig, answers.apiDomain, answers.nsDomain)
    await initArmor(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
    await syncArmor()
    await getZone(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
    await Logger.sync(
      `Copy nameServer's addresses above and paste them to your DNS settings`
    )

    await Logger.success(
      `✔︎ created Load Balancer!\nhttps will be ready in about an hour after your DNS settings 🎉`
    )
  })
}

export const apiRunDeploy = async (kinpachiConfig: KinpachiCloudConfig) => {
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

export const setupCloud = async (
  kinpachiConfig: KinpachiCloudConfig,
  repoName: string
) => {
  await Logger.sync(`setting up your google cloud platform...`)
  await setGcloudProject(kinpachiConfig.api.projectId)
  await gitInit()
  await gitCryptInit()
  await gitCommit()
  await createGitRepo(repoName)
  await setupGcp(kinpachiConfig)
  await addEnvSync(API_ENV_PRODUCTION_PATH)
  await setupActions()
  await apiRunDeploy(kinpachiConfig)
  await syncRunUrl()
}
