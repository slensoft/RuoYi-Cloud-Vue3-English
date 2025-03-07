import useTagsViewStore from '@/store/modules/tagsView'
import router from '@/router'

export default {
  // Refresh the current tab
  refreshPage(obj) {
    const { path, query, matched } = router.currentRoute.value;
    if (obj === undefined) {
      matched.forEach((m) => {
        if (m.components && m.components.default && m.components.default.name) {
          if (!['Layout', 'ParentView'].includes(m.components.default.name)) {
            obj = { name: m.components.default.name, path: path, query: query };
          }
        }
      });
    }
    return useTagsViewStore().delCachedView(obj).then(() => {
      const { path, query } = obj
      router.replace({
        path: '/redirect' + path,
        query: query
      })
    })
  },
  // Close the current tab and open a new tab
  closeOpenPage(obj) {
    useTagsViewStore().delView(router.currentRoute.value);
    if (obj !== undefined) {
      return router.push(obj);
    }
  },
  // Close the specified tab
  closePage(obj) {
    if (obj === undefined) {
      return useTagsViewStore().delView(router.currentRoute.value).then(({ visitedViews }) => {
        const latestView = visitedViews.slice(-1)[0]
        if (latestView) {
          return router.push(latestView.fullPath)
        }
        return router.push('/');
      });
    }
    return useTagsViewStore().delView(obj);
  },
  // Close all tabs
  closeAllPage() {
    return useTagsViewStore().delAllViews();
  },
  // Close left tabs
  closeLeftPage(obj) {
    return useTagsViewStore().delLeftTags(obj || router.currentRoute.value);
  },
  // Close right tabs
  closeRightPage(obj) {
    return useTagsViewStore().delRightTags(obj || router.currentRoute.value);
  },
  // Close other tabs
  closeOtherPage(obj) {
    return useTagsViewStore().delOthersViews(obj || router.currentRoute.value);
  },
  // Open tab
  openPage(url) {
    return router.push(url);
  },
  // Update tab
  updatePage(obj) {
    return useTagsViewStore().updateVisitedView(obj);
  }
}
