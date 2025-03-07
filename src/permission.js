import router from './router'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import { isRelogin } from '@/utils/request'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

NProgress.configure({ showSpinner: false });

const whiteList = ['/login', '/register'];

router.beforeEach((to, from, next) => {
  NProgress.start()
  if (getToken()) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title)
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      if (useUserStore().roles.length === 0) {
        isRelogin.show = true
        // Check if current user's user_info has been fetched
        useUserStore().getInfo().then(() => {
          isRelogin.show = false
          usePermissionStore().generateRoutes().then(accessRoutes => {
            // Generate accessible route table based on roles permissions
            accessRoutes.forEach(route => {
              if (!isHttp(route.path)) {
                router.addRoute(route) // Dynamically add accessible route table
              }
            })
            next({ ...to, replace: true }) // Hack method to ensure addRoutes is completed
          })
        }).catch(err => {
          useUserStore().logOut().then(() => {
            ElMessage.error(err)
            next({ path: '/' })
          })
        })
      } else {
        next()
      }
    }
  } else {
    // No token
    if (whiteList.indexOf(to.path) !== -1) {
      // In the whitelist, proceed directly
      next()
    } else {
      next(`/login?redirect=${to.fullPath}`) // Otherwise redirect to login page
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
