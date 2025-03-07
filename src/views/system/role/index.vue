<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true" label-width="68px">
         <el-form-item label="Role Name" prop="roleName">
            <el-input
               v-model="queryParams.roleName"
               placeholder="Please enter role name"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Permission Key" prop="roleKey">
            <el-input
               v-model="queryParams.roleKey"
               placeholder="Please enter permission key"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Status" prop="status">
            <el-select
               v-model="queryParams.status"
               placeholder="Role Status"
               clearable
               style="width: 240px"
            >
               <el-option
                  v-for="dict in sys_normal_disable"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="Create Time" style="width: 308px">
            <el-date-picker
               v-model="dateRange"
               value-format="YYYY-MM-DD"
               type="daterange"
               range-separator="-"
               start-placeholder="Start Date"
               end-placeholder="End Date"
            ></el-date-picker>
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
               v-hasPermi="['system:role:add']"
            >Add</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['system:role:edit']"
            >Edit</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['system:role:remove']"
            >Delete</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['system:role:export']"
            >Export</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <!-- Table data -->
      <el-table v-loading="loading" :data="roleList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="Role ID" prop="roleId" width="120" />
         <el-table-column label="Role Name" prop="roleName" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="Permission Key" prop="roleKey" :show-overflow-tooltip="true" width="150" />
         <el-table-column label="Display Order" prop="roleSort" width="100" />
         <el-table-column label="Status" align="center" width="100">
            <template #default="scope">
               <el-switch
                  v-model="scope.row.status"
                  active-value="0"
                  inactive-value="1"
                  @change="handleStatusChange(scope.row)"
               ></el-switch>
            </template>
         </el-table-column>
         <el-table-column label="Create Time" align="center" prop="createTime">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-tooltip content="Edit" placement="top" v-if="scope.row.roleId !== 1">
                <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:role:edit']"></el-button>
              </el-tooltip>
              <el-tooltip content="Delete" placement="top" v-if="scope.row.roleId !== 1">
                <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:role:remove']"></el-button>
              </el-tooltip>
              <el-tooltip content="Data Permissions" placement="top" v-if="scope.row.roleId !== 1">
                <el-button link type="primary" icon="CircleCheck" @click="handleDataScope(scope.row)" v-hasPermi="['system:role:edit']"></el-button>
              </el-tooltip>
              <el-tooltip content="Assign Users" placement="top" v-if="scope.row.roleId !== 1">
                <el-button link type="primary" icon="User" @click="handleAuthUser(scope.row)" v-hasPermi="['system:role:edit']"></el-button>
              </el-tooltip>
            </template>
         </el-table-column>
      </el-table>

      <pagination
         v-show="total > 0"
         :total="total"
         v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize"
         @pagination="getList"
      />

      <!-- Add or modify role configuration dialog -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
         <el-form ref="roleRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="Role Name" prop="roleName">
               <el-input v-model="form.roleName" placeholder="Please enter role name" />
            </el-form-item>
            <el-form-item prop="roleKey">
               <template #label>
                  <span>
                     <el-tooltip content="Permission key defined in controller, e.g.: @PreAuthorize(`@ss.hasRole('admin')`)" placement="top">
                        <el-icon><question-filled /></el-icon>
                     </el-tooltip>
                     Permission Key
                  </span>
               </template>
               <el-input v-model="form.roleKey" placeholder="Please enter permission key" />
            </el-form-item>
            <el-form-item label="Role Order" prop="roleSort">
               <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
            </el-form-item>
            <el-form-item label="Status">
               <el-radio-group v-model="form.status">
                  <el-radio
                     v-for="dict in sys_normal_disable"
                     :key="dict.value"
                     :value="dict.value"
                  >{{ dict.label }}</el-radio>
               </el-radio-group>
            </el-form-item>
            <el-form-item label="Menu Permissions">
               <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">Expand/Collapse</el-checkbox>
               <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">Select All/None</el-checkbox>
               <el-checkbox v-model="form.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">Parent-Child Link</el-checkbox>
               <el-tree
                  class="tree-border"
                  :data="menuOptions"
                  show-checkbox
                  ref="menuRef"
                  node-key="id"
                  :check-strictly="!form.menuCheckStrictly"
                  empty-text="Loading, please wait"
                  :props="{ label: 'label', children: 'children' }"
               ></el-tree>
            </el-form-item>
            <el-form-item label="Remarks">
               <el-input v-model="form.remark" type="textarea" placeholder="Please enter content"></el-input>
            </el-form-item>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">Confirm</el-button>
               <el-button @click="cancel">Cancel</el-button>
            </div>
         </template>
      </el-dialog>

      <!-- Assign role data permissions dialog -->
      <el-dialog :title="title" v-model="openDataScope" width="500px" append-to-body>
         <el-form :model="form" label-width="80px">
            <el-form-item label="Role Name">
               <el-input v-model="form.roleName" :disabled="true" />
            </el-form-item>
            <el-form-item label="Permission Key">
               <el-input v-model="form.roleKey" :disabled="true" />
            </el-form-item>
            <el-form-item label="Permission Scope">
               <el-select v-model="form.dataScope" @change="dataScopeSelectChange">
                  <el-option
                     v-for="item in dataScopeOptions"
                     :key="item.value"
                     :label="item.label"
                     :value="item.value"
                  ></el-option>
               </el-select>
            </el-form-item>
            <el-form-item label="Data Permissions" v-show="form.dataScope == 2">
               <el-checkbox v-model="deptExpand" @change="handleCheckedTreeExpand($event, 'dept')">Expand/Collapse</el-checkbox>
               <el-checkbox v-model="deptNodeAll" @change="handleCheckedTreeNodeAll($event, 'dept')">Select All/None</el-checkbox>
               <el-checkbox v-model="form.deptCheckStrictly" @change="handleCheckedTreeConnect($event, 'dept')">Parent-Child Link</el-checkbox>
               <el-tree
                  class="tree-border"
                  :data="deptOptions"
                  show-checkbox
                  default-expand-all
                  ref="deptRef"
                  node-key="id"
                  :check-strictly="!form.deptCheckStrictly"
                  empty-text="Loading, please wait"
                  :props="{ label: 'label', children: 'children' }"
               ></el-tree>
            </el-form-item>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitDataScope">Confirm</el-button>
               <el-button @click="cancelDataScope">Cancel</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="Role">
import { addRole, changeRoleStatus, dataScope, delRole, getRole, listRole, updateRole, deptTreeSelect } from "@/api/system/role";
import { roleMenuTreeselect, treeselect as menuTreeselect } from "@/api/system/menu";

const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const roleList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);
const menuOptions = ref([]);
const menuExpand = ref(false);
const menuNodeAll = ref(false);
const deptExpand = ref(true);
const deptNodeAll = ref(false);
const deptOptions = ref([]);
const openDataScope = ref(false);
const menuRef = ref(null);
const deptRef = ref(null);

/** Data range options */
const dataScopeOptions = ref([
  { value: "1", label: "All data permissions" },
  { value: "2", label: "Custom data permissions" },
  { value: "3", label: "Department data permissions" },
  { value: "4", label: "Department and below data permissions" },
  { value: "5", label: "Only personal data permissions" }
]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: undefined,
    roleKey: undefined,
    status: undefined
  },
  rules: {
    roleName: [{ required: true, message: "Role name cannot be empty", trigger: "blur" }],
    roleKey: [{ required: true, message: "Permission key cannot be empty", trigger: "blur" }],
    roleSort: [{ required: true, message: "Role order cannot be empty", trigger: "blur" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** Query role list */
function getList() {
  loading.value = true;
  listRole(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    roleList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Search button operation */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** Reset button operation */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

/** Delete button operation */
function handleDelete(row) {
  const roleIds = row.roleId || ids.value;
  proxy.$modal.confirm('Are you sure you want to delete the role with ID "' + roleIds + '"?').then(function () {
    return delRole(roleIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Deleted successfully");
  }).catch(() => {});
}

/** Export button operation */
function handleExport() {
  proxy.download("system/role/export", {
    ...queryParams.value,
  }, `role_${new Date().getTime()}.xlsx`);
}

/** Multiple selection box data */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.roleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** Role status modification */
function handleStatusChange(row) {
  let text = row.status === "0" ? "enable" : "disable";
  proxy.$modal.confirm('Are you sure you want to ' + text + ' role "' + row.roleName + '"?').then(function () {
    return changeRoleStatus(row.roleId, row.status);
  }).then(() => {
    proxy.$modal.msgSuccess(text + "d successfully");
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0";
  });
}

/** More operations */
function handleCommand(command, row) {
  switch (command) {
    case "handleDataScope":
      handleDataScope(row);
      break;
    case "handleAuthUser":
      handleAuthUser(row);
      break;
    default:
      break;
  }
}

/** Assign users */
function handleAuthUser(row) {
  router.push("/system/role-auth/user/" + row.roleId);
}

/** Query menu tree structure */
function getMenuTreeselect() {
  menuTreeselect().then(response => {
    menuOptions.value = response.data;
  });
}

/** All department node data */
function getDeptAllCheckedKeys() {
  // Currently selected department nodes
  let checkedKeys = deptRef.value.getCheckedKeys();
  // Half-checked department nodes
  let halfCheckedKeys = deptRef.value.getHalfCheckedKeys();
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
  return checkedKeys;
}

/** Reset add form and other data */
function reset() {
  if (menuRef.value != undefined) {
    menuRef.value.setCheckedKeys([]);
  }
  menuExpand.value = false;
  menuNodeAll.value = false;
  deptExpand.value = true;
  deptNodeAll.value = false;
  form.value = {
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    roleSort: 0,
    status: "0",
    menuIds: [],
    deptIds: [],
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    remark: undefined
  };
  proxy.resetForm("roleRef");
}

/** Add role */
function handleAdd() {
  reset();
  getMenuTreeselect();
  open.value = true;
  title.value = "Add Role";
}

/** Modify role */
function handleUpdate(row) {
  reset();
  const roleId = row.roleId || ids.value;
  const roleMenu = getRoleMenuTreeselect(roleId);
  getRole(roleId).then(response => {
    form.value = response.data;
    form.value.roleSort = Number(form.value.roleSort);
    open.value = true;
    nextTick(() => {
      roleMenu.then((res) => {
        let checkedKeys = res.checkedKeys;
        checkedKeys.forEach((v) => {
          nextTick(() => {
            menuRef.value.setChecked(v, true, false);
          });
        });
      });
    });
    title.value = "Edit Role";
  });
}

/** Query menu tree structure by role ID */
function getRoleMenuTreeselect(roleId) {
  return roleMenuTreeselect(roleId).then(response => {
    menuOptions.value = response.menus;
    return response;
  });
}

/** Query department tree structure by role ID */
function getDeptTree(roleId) {
  return deptTreeSelect(roleId).then(response => {
    deptOptions.value = response.depts;
    return response;
  });
}

/** Tree permissions (expand/collapse) */
function handleCheckedTreeExpand(value, type) {
  if (type == "menu") {
    let treeList = menuOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      menuRef.value.store.nodesMap[treeList[i].id].expanded = value;
    }
  } else if (type == "dept") {
    let treeList = deptOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      deptRef.value.store.nodesMap[treeList[i].id].expanded = value;
    }
  }
}

/** Tree permissions (select all/none) */
function handleCheckedTreeNodeAll(value, type) {
  if (type == "menu") {
    menuRef.value.setCheckedNodes(value ? menuOptions.value : []);
  } else if (type == "dept") {
    deptRef.value.setCheckedNodes(value ? deptOptions.value : []);
  }
}

/** Tree permissions (parent-child link) */
function handleCheckedTreeConnect(value, type) {
  if (type == "menu") {
    form.value.menuCheckStrictly = value ? true : false;
  } else if (type == "dept") {
    form.value.deptCheckStrictly = value ? true : false;
  }
}

/** All menu node data */
function getMenuAllCheckedKeys() {
  // Currently selected menu nodes
  let checkedKeys = menuRef.value.getCheckedKeys();
  // Half-checked menu nodes
  let halfCheckedKeys = menuRef.value.getHalfCheckedKeys();
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys);
  return checkedKeys;
}

/** Submit button */
function submitForm() {
  proxy.$refs["roleRef"].validate(valid => {
    if (valid) {
      if (form.value.roleId != undefined) {
        form.value.menuIds = getMenuAllCheckedKeys();
        updateRole(form.value).then(response => {
          proxy.$modal.msgSuccess("Modified successfully");
          open.value = false;
          getList();
        });
      } else {
        form.value.menuIds = getMenuAllCheckedKeys();
        addRole(form.value).then(response => {
          proxy.$modal.msgSuccess("Added successfully");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** Cancel button */
function cancel() {
  open.value = false;
  reset();
}

/** Role permission scope selection trigger */
function dataScopeSelectChange(value) {
  if (value !== "2") {
    deptRef.value.setCheckedKeys([]);
  }
}

/** Assign data permissions operation */
function handleDataScope(row) {
  reset();
  const deptTreeSelect = getDeptTree(row.roleId);
  getRole(row.roleId).then(response => {
    form.value = response.data;
    openDataScope.value = true;
    nextTick(() => {
      deptTreeSelect.then(res => {
        nextTick(() => {
          if (deptRef.value) {
            deptRef.value.setCheckedKeys(res.checkedKeys);
          }
        });
      });
    });
    title.value = "Assign Data Permissions";
  });
}

/** Submit button (data permissions) */
function submitDataScope() {
  if (form.value.roleId != undefined) {
    form.value.deptIds = getDeptAllCheckedKeys();
    dataScope(form.value).then(response => {
      proxy.$modal.msgSuccess("Modified successfully");
      openDataScope.value = false;
      getList();
    });
  }
}

/** Cancel button (data permissions) */
function cancelDataScope() {
  openDataScope.value = false;
  reset();
}

getList();
</script>
