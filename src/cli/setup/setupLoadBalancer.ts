import {
  addBackend,
  createBackend,
  createCaaRecords,
  createFixIp,
  createFr,
  createLb,
  createNeg,
  createProxy,
  createRecord,
  createSsl,
  createZone,
  getZone,
  syncApiUrl,
} from '@/cli'
import { getIp, setGcloudProject } from '@/cli'
import { KinpachiCloudConfig } from '@/index'
import { getNetworkConfig } from '@/lib/getNetworkConfig'
import { Logger } from '@/lib/logger'

export const setupLoadBalancer = async (
  kinpachiConfig: KinpachiCloudConfig,
  apiDomain: string,
  nsDomain: string
) => {
  try {
    await setGcloudProject(kinpachiConfig.api.projectId)
    const networkConf = await getNetworkConfig(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName
    )
    await createFixIp(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.region,
      networkConf.loadBalancerIpName,
      true
    )
    await createNeg(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName,
      kinpachiConfig.api.region
    )
    await createBackend(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName
    )
    await addBackend(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName,
      kinpachiConfig.api.region
    )
    await createLb(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
    await createSsl(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName,
      apiDomain
    )
    await createProxy(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)
    await createFr(kinpachiConfig.api.projectId, kinpachiConfig.api.appName)

    const ip = await getIp(
      kinpachiConfig.api.projectId,
      networkConf.loadBalancerIpName
    )

    await createZone(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName,
      nsDomain
    )

    await createRecord(
      kinpachiConfig.api.projectId,
      networkConf.zoneName,
      apiDomain,
      ip
    )
    await createCaaRecords(
      kinpachiConfig.api.projectId,
      networkConf.zoneName,
      apiDomain
    )
    await syncApiUrl(kinpachiConfig, apiDomain)
  } catch (error) {
    await Logger.error(`setupLoadBalancer error: ${JSON.stringify(error)}`)
    process.exit(1)
  }
}
