<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true">
         <el-form-item label="Login Address" prop="ipaddr">
            <el-input
               v-model="queryParams.ipaddr"
               placeholder="Please enter login address"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Username" prop="userName">
            <el-input
               v-model="queryParams.userName"
               placeholder="Please enter username"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">Search</el-button>
            <el-button icon="Refresh" @click="resetQuery">Reset</el-button>
         </el-form-item>
      </el-form>
      <el-table
         v-loading="loading"
         :data="onlineList.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
         style="width: 100%;"
      >
         <el-table-column label="ID" width="50" type="index" align="center">
            <template #default="scope">
               <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Session ID" align="center" prop="tokenId" :show-overflow-tooltip="true" />
         <el-table-column label="Login Name" align="center" prop="userName" :show-overflow-tooltip="true" />
         <el-table-column label="Host" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
         <el-table-column label="Login Time" align="center" prop="loginTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.loginTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="Delete" @click="handleForceLogout(scope.row)" v-hasPermi="['monitor:online:forceLogout']">Force Logout</el-button>
            </template>
         </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="pageNum" v-model:limit="pageSize" />
   </div>
</template>

<script setup name="Online">
import { forceLogout, list as initData } from "@/api/monitor/online";

const { proxy } = getCurrentInstance();

const onlineList = ref([]);
const loading = ref(true);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);

const queryParams = ref({
  ipaddr: undefined,
  userName: undefined
});

/** Query login log list */
function getList() {
  loading.value = true;
  initData(queryParams.value).then(response => {
    onlineList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Search button operation */
function handleQuery() {
  pageNum.value = 1;
  getList();
}

/** Reset button operation */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** Force logout button operation */
function handleForceLogout(row) {
    proxy.$modal.confirm('Are you sure to force logout user "' + row.userName + '"?').then(function () {
  return forceLogout(row.tokenId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Logout successful");
  }).catch(() => {});
}

getList();
</script>
