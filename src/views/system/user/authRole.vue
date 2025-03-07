<template>
   <div class="app-container">
      <h4 class="form-header h4">Basic Information</h4>
      <el-form :model="form" label-width="80px">
         <el-row>
            <el-col :span="8" :offset="2">
               <el-form-item label="Nickname" prop="nickName">
                  <el-input v-model="form.nickName" disabled />
               </el-form-item>
            </el-col>
            <el-col :span="8" :offset="2">
               <el-form-item label="Login Account" prop="userName">
                  <el-input v-model="form.userName" disabled />
               </el-form-item>
            </el-col>
         </el-row>
      </el-form>

      <h4 class="form-header h4">Role Information</h4>
      <el-table v-loading="loading" :row-key="getRowKey" @row-click="clickRow" ref="roleRef" @selection-change="handleSelectionChange" :data="roles.slice((pageNum - 1) * pageSize, pageNum * pageSize)">
         <el-table-column label="ID" width="55" type="index" align="center">
            <template #default="scope">
               <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
            </template>
         </el-table-column>
         <el-table-column type="selection" :reserve-selection="true" width="55"></el-table-column>
         <el-table-column label="Role ID" align="center" prop="roleId" />
         <el-table-column label="Role Name" align="center" prop="roleName" />
         <el-table-column label="Permission Key" align="center" prop="roleKey" />
         <el-table-column label="Create Time" align="center" prop="createTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="pageNum" v-model:limit="pageSize" />

      <el-form label-width="100px">
         <div style="text-align: center;margin-left:-120px;margin-top:30px;">
            <el-button type="primary" @click="submitForm()">Submit</el-button>
            <el-button @click="close()">Back</el-button>
         </div>
      </el-form>
   </div>
</template>

<script setup name="AuthRole">
import { getAuthRole, updateAuthRole } from "@/api/system/user";

const route = useRoute();
const { proxy } = getCurrentInstance();

const loading = ref(true);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const roleIds = ref([]);
const roles = ref([]);
const form = ref({
  nickName: undefined,
  userName: undefined,
  userId: undefined
});

/** Click to select row data */
function clickRow(row) {
  proxy.$refs["roleRef"].toggleRowSelection(row);
};

/** Multiple selection box data */
function handleSelectionChange(selection) {
  roleIds.value = selection.map(item => item.roleId);
};

/** Save selected data ID */
function getRowKey(row) {
  return row.roleId;
};

/** Close button */
function close() {
  const obj = { path: "/system/user" };
  proxy.$tab.closeOpenPage(obj);
};

/** Submit button */
function submitForm() {
  const userId = form.value.userId;
  const rIds = roleIds.value.join(",");
  updateAuthRole({ userId: userId, roleIds: rIds }).then(response => {
    proxy.$modal.msgSuccess("Authorization successful");
    close();
  });
};

(() => {
  const userId = route.params && route.params.userId;
  if (userId) {
    loading.value = true;
    getAuthRole(userId).then(response => {
      form.value = response.user;
      roles.value = response.roles;
      total.value = roles.value.length;
      nextTick(() => {
        roles.value.forEach(row => {
          if (row.flag) {
            proxy.$refs["roleRef"].toggleRowSelection(row);
          }
        });
      });
      loading.value = false;
    });
  }
})();
</script>
