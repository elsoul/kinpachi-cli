import {
  createServiceAccount,
  createServiceAccountKey,
  dockerLogin,
  runAddAllRole,
  runEnableAllPermission,
  runVpcNat,
  setGcloudProject,
  addJsonEnv,
} from '@/cli'
import { KinpachiCloudConfig } from '@/index'
import { KEYFILE_PATH } from '@/lib/getNetworkConfig'
import { sleep } from '@/utils/time'
import fs from 'fs'
export const setupGcp = async (kinpachiConfig: KinpachiCloudConfig) => {
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
  await sleep(2000)
  await addJsonEnv()
  await sleep(2000)
  await dockerLogin()
  await sleep(2000)
  fs.rmSync(KEYFILE_PATH)
  await runAddAllRole(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
  await runVpcNat(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName,
    kinpachiConfig.api.region
  )
}
