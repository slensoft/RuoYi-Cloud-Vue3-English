import { createApp } from 'vue'

import Cookies from 'js-cookie'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import locale from 'element-plus/es/locale/lang/zh-cn'

import '@/assets/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'
import directive from './directive' // directive

// Register directives
import plugins from './plugins' // plugins
import { download } from '@/utils/request'

// SVG icons
import 'virtual:svg-icons-register'
import SvgIcon from '@/components/SvgIcon'
import elementIcons from '@/components/SvgIcon/svgicon'

import './permission' // permission control

import { useDict } from '@/utils/dict'
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@/utils/ruoyi'

// Pagination component
import Pagination from '@/components/Pagination'
// Custom table toolbar component
import RightToolbar from '@/components/RightToolbar'
// Rich text editor component
import Editor from "@/components/Editor"
// File upload component
import FileUpload from "@/components/FileUpload"
// Image upload component
import ImageUpload from "@/components/ImageUpload"
// Image preview component
import ImagePreview from "@/components/ImagePreview"
// Custom tree select component
import TreeSelect from '@/components/TreeSelect'
// Dictionary tag component
import DictTag from '@/components/DictTag'

const app = createApp(App)

// Mount global methods
app.config.globalProperties.useDict = useDict
app.config.globalProperties.download = download
app.config.globalProperties.parseTime = parseTime
app.config.globalProperties.resetForm = resetForm
app.config.globalProperties.handleTree = handleTree
app.config.globalProperties.addDateRange = addDateRange
app.config.globalProperties.selectDictLabel = selectDictLabel
app.config.globalProperties.selectDictLabels = selectDictLabels

// Mount global components
app.component('DictTag', DictTag)
app.component('Pagination', Pagination)
app.component('TreeSelect', TreeSelect)
app.component('FileUpload', FileUpload)
app.component('ImageUpload', ImageUpload)
app.component('ImagePreview', ImagePreview)
app.component('RightToolbar', RightToolbar)
app.component('Editor', Editor)

app.use(router)
app.use(store)
app.use(plugins)
app.use(elementIcons)
app.component('svg-icon', SvgIcon)

directive(app)

// Use element-plus and set global size
app.use(ElementPlus, {
  locale: locale,
  // Support large、default、small
  size: Cookies.get('size') || 'default'
})

app.mount('#app')
