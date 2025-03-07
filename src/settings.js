export default {
  /**
   * Website Title
   */
  title: import.meta.env.VITE_APP_TITLE,
  /**
   * Sidebar Theme: theme-dark or theme-light
   */
  sideTheme: 'theme-dark',
  /**
   * Whether to show system layout configuration
   */
  showSettings: true,

  /**
   * Whether to show top navigation
   */
  topNav: false,

  /**
   * Whether to show tagsView
   */
  tagsView: true,

  /**
   * Whether to fix header
   */
  fixedHeader: false,

  /**
   * Whether to show logo
   */
  sidebarLogo: true,

  /**
   * Whether to show dynamic title
   */
  dynamicTitle: false,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   */
  errorLog: 'production'
}
