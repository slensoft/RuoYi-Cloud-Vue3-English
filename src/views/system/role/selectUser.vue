<template>
   <!-- Authorize User -->
   <el-dialog title="Select User" v-model="visible" width="800px" top="5vh" append-to-body>
      <el-form :model="queryParams" ref="queryRef" :inline="true">
         <el-form-item label="Username" prop="userName">
            <el-input
               v-model="queryParams.userName"
               placeholder="Please enter username"
               clearable
               style="width: 180px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Phone Number" prop="phonenumber">
            <el-input
               v-model="queryParams.phonenumber"
               placeholder="Please enter phone number"
               clearable
               style="width: 180px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">Search</el-button>
            <el-button icon="Refresh" @click="resetQuery">Reset</el-button>
         </el-form-item>
      </el-form>
      <el-row>
         <el-table @row-click="clickRow" ref="refTable" :data="userList" @selection-change="handleSelectionChange" height="260px">
            <el-table-column type="selection" width="55"></el-table-column>
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
         </el-table>
         <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
         />
      </el-row>
      <template #footer>
         <div class="dialog-footer">
            <el-button type="primary" @click="handleSelectUser">Confirm</el-button>
            <el-button @click="visible = false">Cancel</el-button>
         </div>
      </template>
   </el-dialog>
</template>

<script setup name="SelectUser">
import { authUserSelectAll, unallocatedUserList } from "@/api/system/role";

const props = defineProps({
  roleId: {
    type: [Number, String]
  }
});

const { proxy } = getCurrentInstance();
const { sys_normal_disable } = proxy.useDict("sys_normal_disable");

const userList = ref([]);
const visible = ref(false);
const total = ref(0);
const userIds = ref([]);

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  roleId: undefined,
  userName: undefined,
  phonenumber: undefined
});

// Show dialog
function show() {
  queryParams.roleId = props.roleId;
  getList();
  visible.value = true;
}

/** Select row */
function clickRow(row) {
  proxy.$refs["refTable"].toggleRowSelection(row);
}

// Multiple selection box data
function handleSelectionChange(selection) {
  userIds.value = selection.map(item => item.userId);
}

// Query table data
function getList() {
  unallocatedUserList(queryParams).then(res => {
    userList.value = res.rows;
    total.value = res.total;
  });
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

const emit = defineEmits(["ok"]);
/** Select authorized user operation */
function handleSelectUser() {
  const roleId = queryParams.roleId;
  const uIds = userIds.value.join(",");
  if (uIds == "") {
    proxy.$modal.msgError("Please select users to assign");
    return;
  }
  authUserSelectAll({ roleId: roleId, userIds: uIds }).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    visible.value = false;
    emit("ok");
  });
}

defineExpose({
  show,
});
</script>
