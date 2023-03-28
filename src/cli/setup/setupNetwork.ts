import { runVpcNat, setGcloudProject } from '@/cli'
import { importConfig, KinpachiCloudConfig } from '@/index'

export const setupNetwork = async () => {
  const kinpachiConfig: KinpachiCloudConfig = await importConfig()
  await setGcloudProject(kinpachiConfig.api.projectId)
  await runVpcNat(
    kinpachiConfig.api.projectId,
    kinpachiConfig.api.appName,
    kinpachiConfig.api.region
  )
}
