import { Logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'
import { execSyncCmd } from '@/lib/execSyncCmd'
import * as fileDataOf from '@/templates/init'
import { sleep } from '@/utils/time'
import { API_REPO_URL } from '@/lib/getNetworkConfig'

export const create = async (initAppName: string) => {
  await kinpachiCreate(initAppName)
}

export const kinpachiCreate = async (appName: string) => {
  const appDir = await createApiDir(appName)
  const gitCloneCmd = ['git', 'clone', API_REPO_URL, appDir]
  await execSyncCmd(gitCloneCmd)
  const yarnApiCmd = ['yarn']
  await execSyncCmd(yarnApiCmd, appDir)
  const rmDefaultGit = ['rm', '-rf', '.git']
  await execSyncCmd(rmDefaultGit, appDir)
  await generateInitFiles(appName)
  await sleep(2000)
  const yarnCmd = ['yarn']
  await execSyncCmd(yarnCmd, `./${appName}`)
}

export const createApiDir = async (appName: string) => {
  try {
    const apiDir = path.join(appName, '/apps/api')
    fs.mkdir(apiDir, { recursive: true }, (err) => {
      if (err) throw err
    })
    return apiDir
  } catch (error) {
    return `createApiDir: ${error}`
  }
}

export const generateInitFiles = async (appName: string) => {
  const apiDir = path.join(appName, '/apps/api')
  const packageJson = await fileDataOf.packageJson(appName)
  fs.writeFileSync(
    packageJson.filePath,
    JSON.stringify(packageJson.body, null, 2)
  )

  const tsconfigJson = await fileDataOf.tsconfigJson(appName)
  fs.writeFileSync(
    tsconfigJson.filePath,
    JSON.stringify(tsconfigJson.body, null, 2)
  )
  const eslintrcJson = await fileDataOf.eslintrcJson(appName)
  fs.writeFileSync(
    eslintrcJson.filePath,
    JSON.stringify(eslintrcJson.body, null, 2)
  )

  const eslintignore = await fileDataOf.eslintignore(appName)
  fs.writeFileSync(eslintignore.filePath, eslintignore.body)
  const prettierrc = await fileDataOf.prettierrc(appName)
  fs.writeFileSync(
    prettierrc.filePath,
    JSON.stringify(prettierrc.body, null, 2)
  )
  const kinpachiCloudConfigGen = await fileDataOf.kinpachiCloudConfigGen(
    appName
  )
  fs.writeFileSync(kinpachiCloudConfigGen.filePath, kinpachiCloudConfigGen.body)
  const prettierignore = await fileDataOf.prettierignore(appName)
  fs.writeFileSync(prettierignore.filePath, prettierignore.body)
  const gitignore = await fileDataOf.gitignore(appName)
  fs.writeFileSync(gitignore.filePath, gitignore.body)
  const rmDefaultEnv = ['rm', '.env']
  await execSyncCmd(rmDefaultEnv, apiDir)
  const apiEnv = await fileDataOf.apiEnv(appName)
  fs.writeFileSync(apiEnv.filePath, apiEnv.body)
  const gitattributes = await fileDataOf.gitattributes(appName)
  fs.writeFileSync(gitattributes.filePath, gitattributes.body)
}
