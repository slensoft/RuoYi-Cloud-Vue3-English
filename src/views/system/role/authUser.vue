<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" v-show="showSearch" :inline="true">
         <el-form-item label="Username" prop="userName">
            <el-input
               v-model="queryParams.userName"
               placeholder="Please enter username"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Phone Number" prop="phonenumber">
            <el-input
               v-model="queryParams.phonenumber"
               placeholder="Please enter phone number"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
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
               @click="openSelectUser"
               v-hasPermi="['system:role:add']"
            >Add User</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="CircleClose"
               :disabled="multiple"
               @click="cancelAuthUserAll"
               v-hasPermi="['system:role:remove']"
            >Batch Cancel Authorization</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button 
               type="warning" 
               plain 
               icon="Close"
               @click="handleClose"
            >Close</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="Username" prop="userName" :show-overflow-tooltip="true" />
         <el-table-column label="Nickname" prop="nickName" :show-overflow-tooltip="true" />
         <el-table-column label="Email" prop="email" :show-overflow-tooltip="true" />
         <el-table-column label="Phone" prop="phonenumber" :show-overflow-tooltip="true" />
         <el-table-column label="Status" align="center" prop="status">
            <template #default="scope">
               <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Create Time" align="center" prop="createTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="CircleClose" @click="cancelAuthUser(scope.row)" v-hasPermi="['system:role:remove']">Cancel Authorization</el-button>
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
      <select-user ref="selectRef" :roleId="queryParams.roleId" @ok="handleQuery" />
   </div>
</template>

<script setup name="AuthUser">
import selectUser from "./selectUser";
import { allocatedUserList, authUserCancel, authUserCancelAll } from "@/api/system/role";

const route = useRoute();
const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const userList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const multiple = ref(true);
const total = ref(0);
const userIds = ref([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  roleId: route.params.roleId,
  userName: undefined,
  phonenumber: undefined,
});

/** Query authorized user list */
function getList() {
  loading.value = true;
  allocatedUserList(queryParams).then(response => {
    userList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Back button */
function handleClose() {
  const obj = { path: "/system/role" };
  proxy.$tab.closeOpenPage(obj);
}

/** Search button operation */
function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

/** Reset button operation */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** Multiple selection box data */
function handleSelectionChange(selection) {
  userIds.value = selection.map(item => item.userId);
  multiple.value = !selection.length;
}

/** Open authorize user dialog */
function openSelectUser() {
  proxy.$refs["selectRef"].show();
}

/** Cancel authorization button operation */
function cancelAuthUser(row) {
  proxy.$modal.confirm('Are you sure you want to cancel the role for user "' + row.userName + '"?').then(function () {
    return authUserCancel({ userId: row.userId, roleId: queryParams.roleId });
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Authorization cancelled successfully");
  }).catch(() => {});
}

/** Batch cancel authorization button operation */
function cancelAuthUserAll(row) {
  const roleId = queryParams.roleId;
  const uIds = userIds.value.join(",");
  proxy.$modal.confirm("Are you sure you want to cancel authorization for selected users?").then(function () {
    return authUserCancelAll({ roleId: roleId, userIds: uIds });
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Authorization cancelled successfully");
  }).catch(() => {});
}

getList();
</script>
