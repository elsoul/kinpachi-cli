import { importConfig, KinpachiCloudConfig } from '@/index'
import {
  API_ENV_PRODUCTION_PATH,
  getRunUrl,
  KINPACHI_CONFIG_PATH,
} from '@/lib/getNetworkConfig'
import { Logger } from '@/lib/logger'
import fs from 'fs'

export const syncRunUrl = async () => {
  const kinpachiConfig: KinpachiCloudConfig = await importConfig()
  await syncApiUrl(kinpachiConfig)
  await Logger.success(`successfully updated cloud run urls!`)
}

export const syncApiUrl = async (
  kinpachiConfig: KinpachiCloudConfig,
  domain: string = ''
) => {
  kinpachiConfig.api.cloudRun.url =
    domain !== ''
      ? `https://${domain}`
      : await getRunUrl(
          kinpachiConfig.api.projectId,
          kinpachiConfig.api.appName
        )
  if (domain) {
    kinpachiConfig.api.cloudRun.url = `https://${domain}`
  } else {
    kinpachiConfig.api.cloudRun.url = await getRunUrl(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName
    )
    const addEnvString = `\nKINPACHI_API_ENDPOINT_URL=${kinpachiConfig.api.cloudRun.url}`
    fs.writeFileSync(API_ENV_PRODUCTION_PATH, addEnvString, { flag: 'a' })
  }
  fs.writeFileSync(
    KINPACHI_CONFIG_PATH,
    JSON.stringify(kinpachiConfig, null, 2)
  )
}
