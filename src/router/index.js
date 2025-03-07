import { createWebHistory, createRouter } from 'vue-router'
/* Layout */
import Layout from '@/layout'

/**
 * Note: Route configuration items
 *
 * hidden: true                     // When set to true, this route will not appear in the sidebar, such as 401, login pages, or some edit pages like /edit/1
 * alwaysShow: true                 // When there are more than one declared routes under a route's children, it will automatically become a nested mode, like component pages
 *                                  // When there is only one, it will treat that child route as the root route displayed in the sidebar, like the guide page
 *                                  // If you want to always display your root route regardless of the number of children declared under the route
 *                                  // You can set alwaysShow: true, so it will ignore the previously defined rules and always display the root route
 * redirect: noRedirect             // When noRedirect is set, this route cannot be clicked in the breadcrumb navigation
 * name:'router-name'               // Set the name of the route, it must be filled in, otherwise various problems will occur when using <keep-alive>
 * query: '{"id": 1, "name": "ry"}' // Default parameters passed when accessing the route
 * roles: ['admin', 'common']       // Role permissions for accessing the route
 * permissions: ['a:a:a', 'b:b:b']  // Menu permissions for accessing the route
 * meta : {
    noCache: true                   // If set to true, it will not be cached by <keep-alive> (default is false)
    title: 'title'                  // Set the name displayed for this route in the sidebar and breadcrumb
    icon: 'svg-name'                // Set the icon for this route, corresponding to the path src/assets/icons/svg
    breadcrumb: false               // If set to false, it will not be displayed in the breadcrumb
    activeMenu: '/system/user'      // When this attribute is set for the route, the corresponding sidebar will be highlighted.
  }
 */

// Public routes
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register'),
    hidden: true
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/index',
    children: [
      {
        path: '/index',
        component: () => import('@/views/index'),
        name: 'Index',
        meta: { title: 'Home', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user' }
      }
    ]
  }
]

// Dynamic routes, loaded dynamically based on user permissions
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: 'Assign Role', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: 'Assign User', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: 'Dictionary Data', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: 'Job Log', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: 'Edit Generation Configuration', activeMenu: '/tool/gen' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
});

export default router;