import fetch from 'node-fetch'

export const kinpachiCloudConfigGen = async (appName: string) => {
  const filePath = `${appName}/kinpachi-cloud.config.json`
  const homeIp = await getHomeIp()
  const body = `{
  "api": {
    "appName": "${appName}",
    "projectId": "${appName}",
    "region": "europe-west4",
    "hasLoadBalancer": false,
    "cloudRun": {
      "name": "kinpachi-${appName}-api",
      "url": "",
      "cpu": 1,
      "maxConcurrency": 80,
      "maxInstances": 100,
      "minInstances": 0,
      "memory": "4Gi"
    },
  },
  "cloudArmor": [
    {
      "securityPolicyName": "kinpachi-${appName}-armor",
      "rules": [
        {
          "priority": "10",
          "description": "Allow Your Home IP addresses",
          "options": {
            "src-ip-ranges": "${homeIp}",
            "action": "allow"
          }
        },
        {
          "priority": "20",
          "description": "Allow host",
          "options": {
            "action": "allow",
            "expression": "has(request.headers['referer']) && request.headers['referer'] == 'http://localhost:4000/'"
          }
        },
        {
          "priority": "100",
          "description": "Defense from SQLi attack",
          "options": {
            "action": "deny-403",
            "expression": "evaluatePreconfiguredExpr('sqli-stable')"
          }
        },
        {
          "priority": "200",
          "description": "Defense from XSS attack",
          "options": {
            "action": "deny-403",
            "expression": "evaluatePreconfiguredExpr('xss-stable')"
          }
        },
        {
          "priority": "300",
          "description": "Defense from NodeJS attack",
          "options": {
            "action": "deny-403",
            "expression": "evaluatePreconfiguredExpr('nodejs-v33-stable')"
          }
        },
        {
          "priority": "2147483647",
          "description": "Deny All IP addresses",
          "options": {
            "action": "deny-403"
          }
        }
      ]
    }
  ]
}  
`
  return {
    filePath,
    body,
  }
}

type IpifyResponse = {
  ip: string
}

export const getHomeIp = async () => {
  const url = 'https://api.ipify.org/?format=json'
  let response = await sendGet(url)
  let data = await response.json()
  const ipifyResponse = data as IpifyResponse
  const ip = ipifyResponse.ip.replace(/\r?\n/g, '')
  return ip
}

const sendGet = async (url: string) => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return res
  } catch (e) {
    console.log({ e })
    throw new Error('sendGET failed')
  }
}
