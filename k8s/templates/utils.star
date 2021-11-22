load("@ytt:data", "data")
load("@ytt:struct", "struct")
load("@ytt:assert", "assert")

if not data.values.rancherProjectName.islower():
  assert.fail("rancherProjectName should be a non-empty lowercased string")
end
if not data.values.projectName.islower():
  assert.fail("projectName should be a non-empty lowercased string")
end
if not data.values.resourceType:
  assert.fail("resourceType should be a non-empty string")
end
if not (data.values.resourceType == "Deploy" or data.values.resourceType == "Job" or data.values.resourceType == "CronJob"):
  assert.fail("resourceType should be 'Deploy', 'Job' or 'CronJob'")
end
if not (data.values.environment == "test" or data.values.environment == "pre-release" or data.values.environment == "release"):
  assert.fail("environment should be 'test', 'pre-release' or 'release'")
end
if data.values.resourceType == "CronJob" and not data.values.schedule:
  assert.fail("You should specify a 'schedule' when 'resourceType' is CronJob")
end
if data.values.hasIngress == None:
  assert.fail("hasIngress should be specify")
end
if data.values.useHttp == None:
  assert.fail("useHttp should be specify")
end

def namespaceName():
  if data.values.namespace:
    return data.values.namespace+"-"+data.values.environment
  else:
    return data.values.projectName+"-"+data.values.environment
  end
end

def deployName():
  return "deploy-"+data.values.projectName
end

def jobName():
  return "job-"+data.values.projectName
end

def cronJobName():
  return "cron-job-"+data.values.projectName
end

def serviceName():
  return "service-"+data.values.projectName
end

def ingressName():
  return "ingress-"+data.values.projectName+"-"+data.values.environment
end

def imageName():
  return "402083338966.dkr.ecr.eu-west-1.amazonaws.com/"+data.values.projectName+":"+data.values.environment
end

def certificateName():
  return "cert-"+data.values.projectName
end

def defaultConfigMapName():
  return "default-conf-"+data.values.projectName
end

def isRelease():
  return data.values.environment == "release"
end

def defaultLabels(instance):
  return { 'app.kubernetes.io/name': data.values.projectName, 'app.kubernetes.io/instance': instance, 'app.kubernetes.io/environment': data.values.environment }
end

def defaultHostname():
  if isRelease():
  return data.values.productionDomain
  else:
  return data.values.projectName+"-"+data.values.environment+"." + data.values.defaultRootDomain
  end
end

def replaceDefaultServiceNameInRules(rules):
  rulesDict = struct.decode(rules)
  for rule in rulesDict:
    if rule.get('http') and rule["http"].get('paths'):
      for path in rule["http"]["paths"]:
        if path.get('backend') and path["backend"].get('serviceName') and path["backend"]["serviceName"].find("##DEFAULT_SERVICE_NAME") > -1:
          path["backend"]["serviceName"] = serviceName()
        end
      end
    end
  end
  return rulesDict
end

def recursiveLookupForStringAndReplace(obj, lookupString, newValue):
  if (type(obj) == "string"):
    return obj.replace(lookupString, newValue)
  end
  if (type(obj) == "struct"):
    obj = struct.decode(obj)
  end
  if type(obj) == "list":
    return [recursiveLookupForStringAndReplace(item, lookupString, newValue) for item in obj]
  end
  if type(obj) == "dict":
    return { key: recursiveLookupForStringAndReplace(value, lookupString, newValue) for key, value in obj.items() }
  end
  return obj
end

utils = struct.make(recursiveLookupForStringAndReplace=recursiveLookupForStringAndReplace, cronJobName=cronJobName, jobName=jobName, replaceDefaultServiceNameInRules=replaceDefaultServiceNameInRules, certificateName=certificateName, defaultConfigMapName=defaultConfigMapName, imageName=imageName, isRelease=isRelease, deployName=deployName, serviceName=serviceName, ingressName=ingressName, defaultLabels=defaultLabels, defaultHostname=defaultHostname, namespaceName=namespaceName)