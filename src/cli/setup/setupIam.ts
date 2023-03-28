import {
  createServiceAccount,
  createServiceAccountKey,
  runAddAllRole,
  runEnableAllPermission,
  setGcloudProject,
} from '@/cli'
import { importConfig, KinpachiCloudConfig } from '@/index'

export const setupIam = async () => {
  const kinpachiConfig: KinpachiCloudConfig = await importConfig()
  await setGcloudProject(kinpachiConfig.api.projectId)
  await runEnableAllPermission(kinpachiConfig.api.projectId)
  await createServiceAccount(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName
  )
  await createServiceAccountKey(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName
  )
  await runAddAllRole(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
}
