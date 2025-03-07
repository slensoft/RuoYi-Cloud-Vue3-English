<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="Menu Name" prop="menuName">
            <el-input
               v-model="queryParams.menuName"
               placeholder="Please enter menu name"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Status" prop="status">
            <el-select v-model="queryParams.status" placeholder="Menu Status" clearable style="width: 200px">
               <el-option
                  v-for="dict in sys_normal_disable"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">Search</el-button>
            <el-button icon="Refresh" @click="resetQuery">Reset</el-button>
         </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Plus"
               @click="handleAdd"
               v-hasPermi="['system:menu:add']"
            >Add</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="info"
               plain
               icon="Sort"
               @click="toggleExpandAll"
            >Expand/Collapse</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table
         v-if="refreshTable"
         v-loading="loading"
         :data="menuList"
         row-key="menuId"
         :default-expand-all="isExpandAll"
         :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
         <el-table-column prop="menuName" label="Menu Name" :show-overflow-tooltip="true" width="160"></el-table-column>
         <el-table-column prop="icon" label="Icon" align="center" width="100">
            <template #default="scope">
               <svg-icon :icon-class="scope.row.icon" />
            </template>
         </el-table-column>
         <el-table-column prop="orderNum" label="Order" width="60"></el-table-column>
         <el-table-column prop="perms" label="Permission" :show-overflow-tooltip="true"></el-table-column>
         <el-table-column prop="component" label="Component Path" :show-overflow-tooltip="true"></el-table-column>
         <el-table-column prop="status" label="Status" width="80">
            <template #default="scope">
               <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Create Time" align="center" width="160" prop="createTime">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" width="210" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:menu:edit']">Edit</el-button>
               <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['system:menu:add']">Add</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:menu:remove']">Delete</el-button>
            </template>
         </el-table-column>
      </el-table>

      <!-- Add or Edit Menu Dialog -->
      <el-dialog :title="title" v-model="open" width="680px" append-to-body>
         <el-form ref="menuRef" :model="form" :rules="rules" label-width="100px">
            <el-row>
               <el-col :span="24">
                  <el-form-item label="Parent Menu">
                     <el-tree-select
                        v-model="form.parentId"
                        :data="menuOptions"
                        :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
                        value-key="menuId"
                        placeholder="Select parent menu"
                        check-strictly
                     />
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Menu Type" prop="menuType">
                     <el-radio-group v-model="form.menuType">
                        <el-radio value="M">Directory</el-radio>
                        <el-radio value="C">Menu</el-radio>
                        <el-radio value="F">Button</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="12" v-if="form.menuType != 'F'">
                  <el-form-item label="Menu Icon" prop="icon">
                     <el-popover
                        placement="bottom-start"
                        :width="540"
                        trigger="click"
                     >
                        <template #reference>
                           <el-input v-model="form.icon" placeholder="Click to select icon" @blur="showSelectIcon" readonly>
                              <template #prefix>
                                 <svg-icon
                                    v-if="form.icon"
                                    :icon-class="form.icon"
                                    class="el-input__icon"
                                    style="height: 32px;width: 16px;"
                                 />
                                 <el-icon v-else style="height: 32px;width: 16px;"><search /></el-icon>
                              </template>
                           </el-input>
                        </template>
                        <icon-select ref="iconSelectRef" @selected="selected" :active-icon="form.icon" />
                     </el-popover>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Display Order" prop="orderNum">
                     <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Menu Name" prop="menuName">
                     <el-input v-model="form.menuName" placeholder="Please enter menu name" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType == 'C'">
                  <el-form-item prop="routeName">
                     <template #label>
                        <span>
                           <el-tooltip content="Default is the same as the route address: e.g., if the address is: `user`, then the name is `User` (note: because router will delete routes with the same name, please customize in special cases to ensure uniqueness)" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Route Name
                        </span>
                     </template>
                     <el-input v-model="form.routeName" placeholder="Please enter route name" />
                  </el-form-item>
               </el-col>
               <el-col :span="12" v-if="form.menuType != 'F'">
                  <el-form-item>
                     <template #label>
                        <span>
                           <el-tooltip content="Select if it's an external link, the route address needs to start with `http(s)://`" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>Is External Link
                        </span>
                     </template>
                     <el-radio-group v-model="form.isFrame">
                        <el-radio value="0">Yes</el-radio>
                        <el-radio value="1">No</el-radio>
                     </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType != 'F'">
                  <el-form-item prop="path">
                     <template #label>
                        <span>
                           <el-tooltip content="Route address for access, e.g., `user`, if it's an external network address for internal access, it needs to start with `http(s)://`" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Route Address
                        </span>
                     </template>
                     <el-input v-model="form.path" placeholder="Please enter route address" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType == 'C'">
                  <el-form-item prop="component">
                     <template #label>
                        <span>
                           <el-tooltip content="Access component path, e.g., `system/user/index`, default in `views` directory" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Component Path
                        </span>
                     </template>
                     <el-input v-model="form.component" placeholder="Please enter component path" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType != 'M'">
                  <el-form-item>
                     <el-input v-model="form.perms" placeholder="Please enter permission identifier" maxlength="100" />
                     <template #label>
                        <span>
                           <el-tooltip content="Permission character defined in controller, e.g., @PreAuthorize(`@ss.hasPermi('system:user:list')`)" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Permission Character
                        </span>
                     </template>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType == 'C'">
                  <el-form-item>
                     <el-input v-model="form.query" placeholder="Please enter route parameters" maxlength="255" />
                     <template #label>
                        <span>
                           <el-tooltip content='Default passing parameters for accessing routes, e.g., `{"id": 1, "name": "ry"}`' placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Route Parameters
                        </span>
                     </template>
                  </el-form-item>
                </el-col>
                <el-col :span="12" v-if="form.menuType == 'C'">
                  <el-form-item>
                     <template #label>
                        <span>
                           <el-tooltip content="Select if it will be cached by `keep-alive`, need to match component's `name` and address" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Is Cache
                        </span>
                     </template>
                     <el-radio-group v-model="form.isCache">
                        <el-radio value="0">Cache</el-radio>
                        <el-radio value="1">No Cache</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="12" v-if="form.menuType != 'F'">
                  <el-form-item>
                     <template #label>
                        <span>
                           <el-tooltip content="Select if hidden, the route will not appear in the sidebar, but can still be accessed" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Display Status
                        </span>
                     </template>
                     <el-radio-group v-model="form.visible">
                        <el-radio
                           v-for="dict in sys_show_hide"
                           :key="dict.value"
                           :value="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item>
                     <template #label>
                        <span>
                           <el-tooltip content="Select if stopped, the route will not appear in the sidebar, and cannot be accessed" placement="top">
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                           Menu Status
                        </span>
                     </template>
                     <el-radio-group v-model="form.status">
                        <el-radio
                           v-for="dict in sys_normal_disable"
                           :key="dict.value"
                           :value="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">Confirm</el-button>
               <el-button @click="cancel">Cancel</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="Menu">
import { addMenu, delMenu, getMenu, listMenu, updateMenu } from "@/api/system/menu";
import SvgIcon from "@/components/SvgIcon";
import IconSelect from "@/components/IconSelect";

const { proxy } = getCurrentInstance();
const { sys_show_hide, sys_normal_disable } = proxy.useDict("sys_show_hide", "sys_normal_disable");

const menuList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const menuOptions = ref([]);
const isExpandAll = ref(false);
const refreshTable = ref(true);
const iconSelectRef = ref(null);

const data = reactive({
  form: {},
  queryParams: {
    menuName: undefined,
    visible: undefined
  },
  rules: {
    menuName: [{ required: true, message: "Menu name cannot be empty", trigger: "blur" }],
    orderNum: [{ required: true, message: "Display order cannot be empty", trigger: "blur" }],
    path: [{ required: true, message: "Route address cannot be empty", trigger: "blur" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** Query menu list */
function getList() {
  loading.value = true;
  listMenu(queryParams.value).then(response => {
    menuList.value = proxy.handleTree(response.data, "menuId");
    loading.value = false;
  });
}

/** Query menu dropdown tree structure */
function getTreeselect() {
  menuOptions.value = [];
  listMenu().then(response => {
    const menu = { menuId: 0, menuName: "Main Category", children: [] };
    menu.children = proxy.handleTree(response.data, "menuId");
    menuOptions.value.push(menu);
  });
}

/** Cancel button */
function cancel() {
  open.value = false;
  reset();
}

/** Form reset */
function reset() {
  form.value = {
    menuId: undefined,
    parentId: 0,
    menuName: undefined,
    icon: undefined,
    menuType: "M",
    orderNum: undefined,
    isFrame: "1",
    isCache: "0",
    visible: "0",
    status: "0"
  };
  proxy.resetForm("menuRef");
}

/** Show dropdown icon */
function showSelectIcon() {
  iconSelectRef.value.reset();
}

/** Select icon */
function selected(name) {
  form.value.icon = name;
}

/** Search button operation */
function handleQuery() {
  getList();
}

/** Reset button operation */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** Add button operation */
function handleAdd(row) {
  reset();
  getTreeselect();
  if (row != null && row.menuId) {
    form.value.parentId = row.menuId;
  } else {
    form.value.parentId = 0;
  }
  open.value = true;
  title.value = "Add Menu";
}

/** Expand/Collapse operation */
function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

/** Edit button operation */
async function handleUpdate(row) {
  reset();
  await getTreeselect();
  getMenu(row.menuId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "Edit Menu";
  });
}

/** Submit button */
function submitForm() {
  proxy.$refs["menuRef"].validate(valid => {
    if (valid) {
      if (form.value.menuId != undefined) {
        updateMenu(form.value).then(response => {
          proxy.$modal.msgSuccess("Modification successful");
          open.value = false;
          getList();
        });
      } else {
        addMenu(form.value).then((response) => {
          proxy.$modal.msgSuccess("Add successful");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** Delete button operation */
function handleDelete(row) {
  proxy.$modal.confirm('Are you sure you want to delete the menu "' + row.menuName + '"?').then(function() {
    return delMenu(row.menuId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Delete successful");
  }).catch(() => {});
}

getList();
</script>
