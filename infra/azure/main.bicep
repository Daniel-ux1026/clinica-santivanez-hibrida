targetScope = 'resourceGroup'

@description('Región permitida por la política de la suscripción.')
param location string = resourceGroup().location
param publicVmSize string = 'Standard_B2ats_v2'
param privateVmSize string = 'Standard_B2als_v2'
param adminUsername string = 'clinicadmin'
param sshPublicKey string
@minLength(40)
@maxLength(40)
@description('SHA completo del código público revisado en Dev.')
param sourceCommit string
@secure()
param publicDbPassword string
@secure()
param privateDbPassword string
@secure()
param publicAppPassword string
@secure()
param privateAppPassword string
@secure()
param integrationToken string
@secure()
param receptionPassword string
@secure()
param doctorPassword string
@secure()
param adminPassword string

var tags = { project: 'santivanez-apf2', environment: 'academic-synthetic', managedBy: 'Bicep' }
var publicAddress = '10.60.10.4'
var privateAddress = '10.60.20.4'
var dnsLabel = 'santivanez-apf2-${uniqueString(resourceGroup().id)}'
var image = { publisher: 'Canonical', offer: 'ubuntu-24_04-lts', sku: 'server', version: 'latest' }
var publicSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', 'vnet-santivanez-apf2', 'public')
var privateSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', 'vnet-santivanez-apf2', 'private')

resource webIp 'Microsoft.Network/publicIPAddresses@2024-05-01' = {
  name: 'pip-web-apf2'
  location: location
  tags: tags
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static', dnsSettings: { domainNameLabel: dnsLabel } }
}
resource natIp 'Microsoft.Network/publicIPAddresses@2024-05-01' = {
  name: 'pip-nat-apf2'
  location: location
  tags: tags
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}
resource nat 'Microsoft.Network/natGateways@2024-05-01' = {
  name: 'nat-santivanez-apf2'
  location: location
  tags: tags
  sku: { name: 'Standard' }
  properties: { idleTimeoutInMinutes: 4, publicIpAddresses: [{ id: natIp.id }] }
}
resource publicRoutes 'Microsoft.Network/routeTables@2024-05-01' = {
  name: 'rt-public-apf2'
  location: location
  tags: tags
  properties: {
    disableBgpRoutePropagation: true
    routes: [{ name: 'internet-egress', properties: { addressPrefix: '0.0.0.0/0', nextHopType: 'Internet' } }]
  }
}
resource privateRoutes 'Microsoft.Network/routeTables@2024-05-01' = {
  name: 'rt-private-apf2'
  location: location
  tags: tags
  properties: {
    disableBgpRoutePropagation: true
    // NAT se asocia a la subred; no existe un nextHopType "NatGateway".
    routes: [{ name: 'explicit-egress-via-nat', properties: { addressPrefix: '0.0.0.0/0', nextHopType: 'Internet' } }]
  }
}
resource publicNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-public-apf2'
  location: location
  tags: tags
  properties: {
    securityRules: [
      { name: 'web-http-synthetic', properties: { priority: 100, direction: 'Inbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRange: '80', sourceAddressPrefix: 'Internet', destinationAddressPrefix: publicAddress } }
      { name: 'deny-other-inbound', properties: { priority: 4096, direction: 'Inbound', access: 'Deny', protocol: '*', sourcePortRange: '*', destinationPortRange: '*', sourceAddressPrefix: '*', destinationAddressPrefix: '*' } }
      { name: 'backend-api-only', properties: { priority: 100, direction: 'Outbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRange: '3000', sourceAddressPrefix: publicAddress, destinationAddressPrefix: privateAddress } }
      { name: 'updates-and-container-registry', properties: { priority: 120, direction: 'Outbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRanges: ['80', '443'], sourceAddressPrefix: publicAddress, destinationAddressPrefix: 'Internet' } }
      { name: 'deny-other-outbound', properties: { priority: 4096, direction: 'Outbound', access: 'Deny', protocol: '*', sourcePortRange: '*', destinationPortRange: '*', sourceAddressPrefix: '*', destinationAddressPrefix: '*' } }
    ]
  }
}
resource privateNsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: 'nsg-private-apf2'
  location: location
  tags: tags
  properties: {
    securityRules: [
      { name: 'api-from-web-vm-only', properties: { priority: 100, direction: 'Inbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRange: '3000', sourceAddressPrefix: publicAddress, destinationAddressPrefix: privateAddress } }
      { name: 'deny-other-inbound', properties: { priority: 4096, direction: 'Inbound', access: 'Deny', protocol: '*', sourcePortRange: '*', destinationPortRange: '*', sourceAddressPrefix: '*', destinationAddressPrefix: '*' } }
      { name: 'nat-updates-and-container-registry', properties: { priority: 120, direction: 'Outbound', access: 'Allow', protocol: 'Tcp', sourcePortRange: '*', destinationPortRanges: ['80', '443'], sourceAddressPrefix: privateAddress, destinationAddressPrefix: 'Internet' } }
      { name: 'deny-other-outbound', properties: { priority: 4096, direction: 'Outbound', access: 'Deny', protocol: '*', sourcePortRange: '*', destinationPortRange: '*', sourceAddressPrefix: '*', destinationAddressPrefix: '*' } }
    ]
  }
}
resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-santivanez-apf2'
  location: location
  tags: tags
  properties: {
    addressSpace: { addressPrefixes: ['10.60.0.0/16'] }
    subnets: [
      { name: 'public', properties: { addressPrefix: '10.60.10.0/24', defaultOutboundAccess: false, networkSecurityGroup: { id: publicNsg.id }, routeTable: { id: publicRoutes.id } } }
      { name: 'private', properties: { addressPrefix: '10.60.20.0/24', defaultOutboundAccess: false, networkSecurityGroup: { id: privateNsg.id }, routeTable: { id: privateRoutes.id }, natGateway: { id: nat.id } } }
    ]
  }
}
resource publicNic 'Microsoft.Network/networkInterfaces@2024-05-01' = {
  name: 'nic-web-apf2'
  location: location
  tags: tags
  properties: {
    ipConfigurations: [{ name: 'primary', properties: { privateIPAllocationMethod: 'Static', privateIPAddress: publicAddress, subnet: { id: publicSubnetId }, publicIPAddress: { id: webIp.id } } }]
  }
  dependsOn: [vnet]
}
resource privateNic 'Microsoft.Network/networkInterfaces@2024-05-01' = {
  name: 'nic-private-apf2'
  location: location
  tags: tags
  properties: {
    ipConfigurations: [{ name: 'primary', properties: { privateIPAllocationMethod: 'Static', privateIPAddress: privateAddress, subnet: { id: privateSubnetId } } }]
  }
  dependsOn: [vnet]
}
resource dataDisk 'Microsoft.Compute/disks@2024-03-02' = {
  name: 'disk-postgresql-apf2'
  location: location
  tags: tags
  sku: { name: 'StandardSSD_LRS' }
  properties: { creationData: { createOption: 'Empty' }, diskSizeGB: 32 }
}
resource publicVm 'Microsoft.Compute/virtualMachines@2024-11-01' = {
  name: 'vm-web-apf2'
  location: location
  tags: tags
  properties: {
    hardwareProfile: { vmSize: publicVmSize }
    storageProfile: { imageReference: image, osDisk: { createOption: 'FromImage', diskSizeGB: 32, managedDisk: { storageAccountType: 'StandardSSD_LRS' }, deleteOption: 'Delete' } }
    osProfile: {
      computerName: 'vm-web-apf2'
      adminUsername: adminUsername
      linuxConfiguration: { disablePasswordAuthentication: true, provisionVMAgent: true, ssh: { publicKeys: [{ path: '/home/${adminUsername}/.ssh/authorized_keys', keyData: sshPublicKey }] } }
    }
    networkProfile: { networkInterfaces: [{ id: publicNic.id, properties: { deleteOption: 'Delete' } }] }
    diagnosticsProfile: { bootDiagnostics: { enabled: true } }
  }
}
resource privateVm 'Microsoft.Compute/virtualMachines@2024-11-01' = {
  name: 'vm-private-apf2'
  location: location
  tags: tags
  properties: {
    hardwareProfile: { vmSize: privateVmSize }
    storageProfile: {
      imageReference: image
      osDisk: { createOption: 'FromImage', diskSizeGB: 32, managedDisk: { storageAccountType: 'StandardSSD_LRS' }, deleteOption: 'Delete' }
      dataDisks: [{ lun: 0, createOption: 'Attach', managedDisk: { id: dataDisk.id }, deleteOption: 'Detach' }]
    }
    osProfile: {
      computerName: 'vm-private-apf2'
      adminUsername: adminUsername
      linuxConfiguration: { disablePasswordAuthentication: true, provisionVMAgent: true, ssh: { publicKeys: [{ path: '/home/${adminUsername}/.ssh/authorized_keys', keyData: sshPublicKey }] } }
    }
    networkProfile: { networkInterfaces: [{ id: privateNic.id, properties: { deleteOption: 'Delete' } }] }
    diagnosticsProfile: { bootDiagnostics: { enabled: true } }
  }
}
var commonConfig = { sourceCommit: sourceCommit, publicOrigin: 'http://${webIp.properties.dnsSettings.fqdn}', privateAddress: privateAddress }
var bootstrapText = loadTextContent('bootstrap.sh')
var publicConfig = union(commonConfig, { role: 'public', env: {} })
var privateConfig = union(commonConfig, {
  role: 'private'
  env: {
    PUBLIC_DB_PASSWORD: publicDbPassword
    PRIVATE_DB_PASSWORD: privateDbPassword
    PUBLIC_APP_PASSWORD: publicAppPassword
    PRIVATE_APP_PASSWORD: privateAppPassword
    INTEGRATION_TOKEN: integrationToken
    RECEPTION_PASSWORD: receptionPassword
    DOCTOR_PASSWORD: doctorPassword
    ADMIN_PASSWORD: adminPassword
  }
})
resource privateBootstrap 'Microsoft.Compute/virtualMachines/extensions@2024-11-01' = {
  parent: privateVm
  name: 'bootstrap-apf2'
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    protectedSettings: { script: base64('${bootstrapText}\nmain ${base64(string(privateConfig))}\n') }
  }
}
resource publicBootstrap 'Microsoft.Compute/virtualMachines/extensions@2024-11-01' = {
  parent: publicVm
  name: 'bootstrap-apf2'
  location: location
  properties: {
    publisher: 'Microsoft.Azure.Extensions'
    type: 'CustomScript'
    typeHandlerVersion: '2.1'
    autoUpgradeMinorVersion: true
    protectedSettings: { script: base64('${bootstrapText}\nmain ${base64(string(publicConfig))}\n') }
  }
  dependsOn: [privateBootstrap]
}
resource publicShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = {
  name: 'shutdown-computevm-${publicVm.name}'
  location: location
  tags: tags
  properties: { status: 'Enabled', taskType: 'ComputeVmShutdownTask', dailyRecurrence: { time: '0300' }, timeZoneId: 'SA Pacific Standard Time', targetResourceId: publicVm.id, notificationSettings: { status: 'Disabled', timeInMinutes: 30 } }
}
resource privateShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = {
  name: 'shutdown-computevm-${privateVm.name}'
  location: location
  tags: tags
  properties: { status: 'Enabled', taskType: 'ComputeVmShutdownTask', dailyRecurrence: { time: '0300' }, timeZoneId: 'SA Pacific Standard Time', targetResourceId: privateVm.id, notificationSettings: { status: 'Disabled', timeInMinutes: 30 } }
}
output publicUrl string = 'http://${webIp.properties.dnsSettings.fqdn}'
output publicIp string = webIp.properties.ipAddress
output natPublicIp string = natIp.properties.ipAddress
output publicPrivateIp string = publicAddress
output privateIp string = privateAddress
output publicVmName string = publicVm.name
output privateVmName string = privateVm.name
