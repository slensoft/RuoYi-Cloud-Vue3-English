import tab from './tab'
import auth from './auth'
import cache from './cache'
import modal from './modal'
import download from './download'

export default function installPlugins(app){
  // Tab operations
  app.config.globalProperties.$tab = tab
  // Authentication object
  app.config.globalProperties.$auth = auth
  // Cache object
  app.config.globalProperties.$cache = cache
  // Modal object
  app.config.globalProperties.$modal = modal
  // Download file
  app.config.globalProperties.$download = download
}
