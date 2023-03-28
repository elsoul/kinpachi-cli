import { importConfig, KinpachiCloudConfig } from '@/index'
import {
  API_ENV_PRODUCTION_PATH,
  getActionsEnvString,
} from '@/lib/getNetworkConfig'
import { Logger } from '@/lib/logger'
import { apiYml } from '@/templates/init'
import fs from 'fs'

export const setupActions = async () => {
  try {
    const kinpachiConfig: KinpachiCloudConfig = await importConfig()
    const envString = await getActionsEnvString(API_ENV_PRODUCTION_PATH)
    const result = await apiYml(
      envString,
      kinpachiConfig.api.cloudRun.memory,
      String(kinpachiConfig.api.cloudRun.cpu),
      String(kinpachiConfig.api.cloudRun.maxConcurrency),
      String(kinpachiConfig.api.cloudRun.maxInstances),
      String(kinpachiConfig.api.cloudRun.minInstances)
    )
    fs.writeFileSync(result.filePath, result.body, { flag: 'w' })
    await Logger.success(`Successfully updated ${result.filePath}!`)

    return true
  } catch (error) {
    console.log(`setupActions: ${error}`)
    throw new Error(`error:${error}`)
  }
}
