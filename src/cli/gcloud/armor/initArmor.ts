import { importConfig } from '@/index'
import { Logger } from '@/lib/logger'
import {
  createSecurityPolicy,
  updateBackendSecurityPolicy,
  updateSecurityPolicy,
} from '@/cli'

export const initArmor = async (projectId: string, appName: string) => {
  const kinpachiConfig = await importConfig()
  await createSecurityPolicy(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName
  )
  await updateBackendSecurityPolicy(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName
  )
  await updateSecurityPolicy(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName
  )
  await Logger.success(`successfully created Cloud Armor!`)
}
