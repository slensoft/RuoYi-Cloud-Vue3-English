<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
         <el-form-item label="Login IP" prop="ipaddr">
            <el-input
               v-model="queryParams.ipaddr"
               placeholder="Please enter login IP"
               clearable
               style="width: 240px;"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Username" prop="userName">
            <el-input
               v-model="queryParams.userName"
               placeholder="Please enter username"
               clearable
               style="width: 240px;"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Status" prop="status">
            <el-select
               v-model="queryParams.status"
               placeholder="Login status"
               clearable
               style="width: 240px"
            >
               <el-option
                  v-for="dict in sys_common_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="Login Time" style="width: 308px">
            <el-date-picker
               v-model="dateRange"
               value-format="YYYY-MM-DD HH:mm:ss"
               type="daterange"
               range-separator="-"
               start-placeholder="Start Date"
               end-placeholder="End Date"
               :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
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
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['system:logininfor:remove']"
            >Delete</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               @click="handleClean"
               v-hasPermi="['system:logininfor:remove']"
            >Clear</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Unlock"
               :disabled="single"
               @click="handleUnlock"
               v-hasPermi="['system:logininfor:unlock']"
            >Unlock</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['system:logininfor:export']"
            >Export</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table ref="logininforRef" v-loading="loading" :data="logininforList" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="Access ID" align="center" prop="infoId" />
         <el-table-column label="Username" align="center" prop="userName" :show-overflow-tooltip="true" sortable="custom" :sort-orders="['descending', 'ascending']" />
         <el-table-column label="Login Status" align="center" prop="status">
            <template #default="scope">
               <dict-tag :options="sys_common_status" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Description" align="center" prop="msg" :show-overflow-tooltip="true" />
         <el-table-column label="Access Time" align="center" prop="accessTime" sortable="custom" :sort-orders="['descending', 'ascending']" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.accessTime) }}</span>
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
   </div>
</template>

<script setup name="Logininfor">
import { list, delLogininfor, cleanLogininfor, unlockLogininfor } from "@/api/system/logininfor";

const { proxy } = getCurrentInstance();
const { sys_common_status } = proxy.useDict("sys_common_status");

const logininforList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const selectName = ref("");
const total = ref(0);
const dateRange = ref([]);
const defaultSort = ref({ prop: "accessTime", order: "descending" });

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  ipaddr: undefined,
  userName: undefined,
  status: undefined,
  orderByColumn: undefined,
  isAsc: undefined
});

/** Query login log list */
function getList() {
  loading.value = true;
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    logininforList.value = response.rows;
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
  queryParams.value.pageNum = 1;
  proxy.$refs["logininforRef"].sort(defaultSort.value.prop, defaultSort.value.order);
}

/** Multiple selection box data */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.infoId);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
  selectName.value = selection.map(item => item.userName);
}

/** Sort trigger event */
function handleSortChange(column, prop, order) {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}

/** Delete button operation */
function handleDelete(row) {
  const infoIds = row.infoId || ids.value;
  proxy.$modal.confirm('Are you sure to delete the access record with ID "' + infoIds + '"?').then(function () {
    return delLogininfor(infoIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Deleted successfully");
  }).catch(() => {});
}

/** Clear button operation */
function handleClean() {
  proxy.$modal.confirm("Are you sure to clear all login log records?").then(function () {
    return cleanLogininfor();
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Cleared successfully");
  }).catch(() => {});
}

/** Unlock button operation */
function handleUnlock() {
  const username = selectName.value;
  proxy.$modal.confirm('Are you sure to unlock user "' + username + '"?').then(function () {
    return unlockLogininfor(username);
  }).then(() => {
    proxy.$modal.msgSuccess("User " + username + " unlocked successfully");
  }).catch(() => {});
}

/** Export button operation */
function handleExport() {
  proxy.download("system/logininfor/export", {
    ...queryParams.value,
  }, `logininfor_${new Date().getTime()}.xlsx`);
}

getList();
</script>
