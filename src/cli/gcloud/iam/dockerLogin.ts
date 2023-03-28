import { execSync } from 'node:child_process'
import { getContainerRegion } from '@/lib/getNetworkConfig'
import { importConfig, KinpachiCloudConfig } from '@/index'

export const dockerLogin = async () => {
  const kinpachiConfig: KinpachiCloudConfig = await importConfig()
  const region = kinpachiConfig.api.region
  const cRegion = await getContainerRegion(region)
  const shCmd = `cat ./keyfile.json | docker login -u _json_key --password-stdin https://${cRegion}`
  execSync(shCmd)
}
