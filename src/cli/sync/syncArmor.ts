import { importConfig, KinpachiCloudConfig } from '@/index'
import { execSync } from 'child_process'
import { getNetworkConfig } from '@/lib/getNetworkConfig'
import {
  createSecurityPolicyRule,
  setGcloudProject,
  updateSecurityPolicyRule,
} from '@/cli'
import { Logger } from '@/lib/logger'

export const syncArmor = async () => {
  const kinpachiConfig = await importConfig()
  await setGcloudProject(kinpachiConfig.api.projectId)
  if (kinpachiConfig.cloudArmor)
    for await (const rule of kinpachiConfig.cloudArmor[0].rules) {
      const result = await isRuleExist(kinpachiConfig, rule.priority)
      if (result) {
        await updateSecurityPolicyRule(
          kinpachiConfig.api.projectId,
          kinpachiConfig.api.appName,
          rule.priority,
          rule.options
        )
      } else {
        console.log('creating...')
        await createSecurityPolicyRule(
          kinpachiConfig.api.projectId,
          kinpachiConfig.api.appName,
          rule.description,
          rule.priority,
          rule.options
        )
      }
    }
  await Logger.success(`successfully updated Cloud Armor!`)
}

export const isRuleExist = async (
  kinpachiConfig: KinpachiCloudConfig,
  priority: string
) => {
  try {
    const appConf = await getNetworkConfig(
      kinpachiConfig.api.projectId,
      kinpachiConfig.api.appName
    )
    if (kinpachiConfig.cloudArmor) {
      const cmd = `gcloud compute security-policies rules describe ${priority} --security-policy=${appConf.securityPolicyName} --project=${kinpachiConfig.api.projectId}`
      execSync(cmd, { stdio: 'ignore' })
    }
    return true
  } catch (error) {
    return false
  }
}
