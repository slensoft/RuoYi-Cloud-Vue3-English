<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    @select="handleSelect"
    :ellipsis="false"
  >
    <template v-for="(item, index) in topMenus">
      <el-menu-item :style="{'--theme': theme}" :index="item.path" :key="index" v-if="index < visibleNumber">
        <svg-icon
        v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
        :icon-class="item.meta.icon"/>
        {{ item.meta.title }}
      </el-menu-item>
    </template>

    <!-- Collapse top menu when exceeding number -->
    <el-sub-menu :style="{'--theme': theme}" index="more" v-if="topMenus.length > visibleNumber">
      <template #title>More Menu</template>
      <template v-for="(item, index) in topMenus">
        <el-menu-item
          :index="item.path"
          :key="index"
          v-if="index >= visibleNumber">
        <svg-icon
          v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
          :icon-class="item.meta.icon"/>
        {{ item.meta.title }}
        </el-menu-item>
      </template>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { constantRoutes } from "@/router"
import { isHttp } from '@/utils/validate'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

// Initial number of top bar
const visibleNumber = ref(null);
// Index of the currently active menu
const currentIndex = ref(null);
// Hidden sidebar routes
const hideList = ['/index', '/user/profile'];

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute();
const router = useRouter();

// Theme color
const theme = computed(() => settingsStore.theme);
// All route information
const routers = computed(() => permissionStore.topbarRouters);

// Top display menu
const topMenus = computed(() => {
  let topMenus = [];
  routers.value.map((menu) => {
    if (menu.hidden !== true) {
      // Compatible with internal jumps of top bar first-level menu
      if (menu.path === "/") {
          topMenus.push(menu.children[0]);
      } else {
          topMenus.push(menu);
      }
    }
  })
  return topMenus;
})

// Set child routes
const childrenMenus = computed(() => {
  let childrenMenus = [];
  routers.value.map((router) => {
    for (let item in router.children) {
      if (router.children[item].parentPath === undefined) {
        if(router.path === "/") {
          router.children[item].path = "/" + router.children[item].path;
        } else {
          if(!isHttp(router.children[item].path)) {
            router.children[item].path = router.path + "/" + router.children[item].path;
          }
        }
        router.children[item].parentPath = router.path;
      }
      childrenMenus.push(router.children[item]);
    }
  })
  return constantRoutes.concat(childrenMenus);
})

// Default active menu
const activeMenu = computed(() => {
  const path = route.path;
  let activePath = path;
  if (path !== undefined && path.lastIndexOf("/") > 0 && hideList.indexOf(path) === -1) {
    const tmpPath = path.substring(1, path.length);
    activePath = "/" + tmpPath.substring(0, tmpPath.indexOf("/"));
    if (!route.meta.link) {
        appStore.toggleSideBarHide(false);
    }
  } else if(!route.children) {
    activePath = path;
    appStore.toggleSideBarHide(true);
  }
  activeRoutes(activePath);
  return activePath;
})

function setVisibleNumber() {
  const width = document.body.getBoundingClientRect().width / 3;
  visibleNumber.value = parseInt(width / 85);
}

function handleSelect(key, keyPath) {
  currentIndex.value = key;
  const route = routers.value.find(item => item.path === key);
  if (isHttp(key)) {
    // Open http(s):// path in a new window
    window.open(key, "_blank");
  } else if (!route || !route.children) {
    // Open path without child routes internally
    const routeMenu = childrenMenus.value.find(item => item.path === key);
    if (routeMenu && routeMenu.query) {
      let query = JSON.parse(routeMenu.query);
      router.push({ path: key, query: query });
    } else {
      router.push({ path: key });
    }
    appStore.toggleSideBarHide(true);
  } else {
    // Show left linkage menu
    activeRoutes(key);
    appStore.toggleSideBarHide(false);
  }
}

function activeRoutes(key) {
  let routes = [];
  if (childrenMenus.value && childrenMenus.value.length > 0) {
    childrenMenus.value.map((item) => {
      if (key == item.parentPath || (key == "index" && "" == item.path)) {
        routes.push(item);
      }
    });
  }
  if(routes.length > 0) {
    permissionStore.setSidebarRouters(routes);
  } else {
    appStore.toggleSideBarHide(true);
  }
  return routes;
}

onMounted(() => {
  window.addEventListener('resize', setVisibleNumber)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', setVisibleNumber)
})

onMounted(() => {
  setVisibleNumber()
})
</script>

<style lang="scss">
.topmenu-container.el-menu--horizontal > .el-menu-item {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #999093 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active, .el-menu--horizontal > .el-sub-menu.is-active .el-submenu__title {
  border-bottom: 2px solid #{'var(--theme)'} !important;
  color: #303133;
}

/* sub-menu item */
.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #999093 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

/* Hide background color */
.topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):focus, .topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):hover, .topmenu-container.el-menu--horizontal>.el-submenu .el-submenu__title:hover {
  background-color: #ffffff !important;
}

/* Right margin of icon */
.topmenu-container .svg-icon {
  margin-right: 4px;
}

/* topmenu more arrow */
.topmenu-container .el-sub-menu .el-sub-menu__icon-arrow {
  position: static;
  vertical-align: middle;
  margin-left: 8px;
  margin-top: 0px;
}
</style>
