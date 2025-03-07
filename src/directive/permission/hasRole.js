/**
 * v-hasRole role permission handling
 * Copyright (c) 2019 ruoyi
 */
 
import useUserStore from '@/store/modules/user'

export default {
  mounted(el, binding, vnode) {
    const { value } = binding
    const super_admin = "admin";
    const roles = useUserStore().roles

    if (value && value instanceof Array && value.length > 0) {
      const roleFlag = value

      const hasRole = roles.some(role => {
        return super_admin === role || roleFlag.includes(role)
      })

      if (!hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`Please set the role permission tag value`)
    }
  }
}
