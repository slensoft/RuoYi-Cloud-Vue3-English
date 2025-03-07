<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="Department Name" prop="deptName">
            <el-input
               v-model="queryParams.deptName"
               placeholder="Please enter department name"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Status" prop="status">
            <el-select v-model="queryParams.status" placeholder="Department status" clearable style="width: 200px">
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
               v-hasPermi="['system:dept:add']"
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
         :data="deptList"
         row-key="deptId"
         :default-expand-all="isExpandAll"
         :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
         <el-table-column prop="deptName" label="Department Name" width="260"></el-table-column>
         <el-table-column prop="orderNum" label="Order" width="200"></el-table-column>
         <el-table-column prop="status" label="Status" width="100">
            <template #default="scope">
               <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Creation Time" align="center" prop="createTime" width="200">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:dept:edit']">Edit</el-button>
               <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['system:dept:add']">Add</el-button>
               <el-button v-if="scope.row.parentId != 0" link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:dept:remove']">Delete</el-button>
            </template>
         </el-table-column>
      </el-table>

      <!-- Add or Edit Department Dialog -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
         <el-form ref="deptRef" :model="form" :rules="rules" label-width="80px">
            <el-row>
               <el-col :span="24" v-if="form.parentId !== 0">
                  <el-form-item label="Parent Department" prop="parentId">
                     <el-tree-select
                        v-model="form.parentId"
                        :data="deptOptions"
                        :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
                        value-key="deptId"
                        placeholder="Select parent department"
                        check-strictly
                     />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Department Name" prop="deptName">
                     <el-input v-model="form.deptName" placeholder="Please enter department name" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Display Order" prop="orderNum">
                     <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Leader" prop="leader">
                     <el-input v-model="form.leader" placeholder="Please enter leader" maxlength="20" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Phone" prop="phone">
                     <el-input v-model="form.phone" placeholder="Please enter phone" maxlength="11" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Email" prop="email">
                     <el-input v-model="form.email" placeholder="Please enter email" maxlength="50" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Department Status">
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

<script setup name="Dept">
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from "@/api/system/dept";

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const deptList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const title = ref("");
const deptOptions = ref([]);
const isExpandAll = ref(true);
const refreshTable = ref(true);

const data = reactive({
  form: {},
  queryParams: {
    deptName: undefined,
    status: undefined
  },
  rules: {
    parentId: [{ required: true, message: "Parent department cannot be empty", trigger: "blur" }],
    deptName: [{ required: true, message: "Department name cannot be empty", trigger: "blur" }],
    orderNum: [{ required: true, message: "Display order cannot be empty", trigger: "blur" }],
    email: [{ type: "email", message: "Please enter a valid email address", trigger: ["blur", "change"] }],
    phone: [{ pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "Please enter a valid phone number", trigger: "blur" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** Query department list */
function getList() {
  loading.value = true;
  listDept(queryParams.value).then((response) => {
    deptList.value = proxy.handleTree(response.data, "deptId");
    loading.value = false;
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
    deptId: undefined,
    parentId: undefined,
    deptName: undefined,
    orderNum: 0,
    leader: undefined,
    phone: undefined,
    email: undefined,
    status: "0",
  };
  proxy.resetForm("deptRef");
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
  listDept().then(response => {
    deptOptions.value = proxy.handleTree(response.data, "deptId");
  });
  if (row != undefined) {
    form.value.parentId = row.deptId;
  }
  open.value = true;
  title.value = "Add Department";
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
function handleUpdate(row) {
  reset();
  listDeptExcludeChild(row.deptId).then(response => {
    deptOptions.value = proxy.handleTree(response.data, "deptId");
  });
  getDept(row.deptId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "Edit Department";
  });
}

/** Submit button */
function submitForm() {
  proxy.$refs["deptRef"].validate(valid => {
    if (valid) {
      if (form.value.deptId != undefined) {
        updateDept(form.value).then(response => {
          proxy.$modal.msgSuccess("Edited successfully");
          open.value = false;
          getList();
        });
      } else {
        addDept(form.value).then(response => {
          proxy.$modal.msgSuccess("Added successfully");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** Delete button operation */
function handleDelete(row) {
  proxy.$modal.confirm('Are you sure you want to delete the department named "' + row.deptName + '"?').then(function() {
    return delDept(row.deptId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Deleted successfully");
  }).catch(() => {});
}

getList();
</script>
