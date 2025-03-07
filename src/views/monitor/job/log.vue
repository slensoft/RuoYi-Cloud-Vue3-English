<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
         <el-form-item label="Job Name" prop="jobName">
            <el-input
               v-model="queryParams.jobName"
               placeholder="Please enter job name"
               clearable
               style="width: 240px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Job Group Name" prop="jobGroup">
            <el-select
               v-model="queryParams.jobGroup"
               placeholder="Please select job group name"
               clearable
               style="width: 240px"
            >
               <el-option
                  v-for="dict in sys_job_group"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="Execution Status" prop="status">
            <el-select
               v-model="queryParams.status"
               placeholder="Please select execution status"
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
         <el-form-item label="Execution Time" style="width: 308px">
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
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['monitor:job:remove']"
            >Delete</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               @click="handleClean"
               v-hasPermi="['monitor:job:remove']"
            >Clear</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['monitor:job:export']"
            >Export</el-button>
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

      <el-table v-loading="loading" :data="jobLogList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="Log ID" width="80" align="center" prop="jobLogId" />
         <el-table-column label="Job Name" align="center" prop="jobName" :show-overflow-tooltip="true" />
         <el-table-column label="Job Group Name" align="center" prop="jobGroup" :show-overflow-tooltip="true">
            <template #default="scope">
               <dict-tag :options="sys_job_group" :value="scope.row.jobGroup" />
            </template>
         </el-table-column>
         <el-table-column label="Invoke Target String" align="center" prop="invokeTarget" :show-overflow-tooltip="true" />
         <el-table-column label="Log Message" align="center" prop="jobMessage" :show-overflow-tooltip="true" />
         <el-table-column label="Execution Status" align="center" prop="status">
            <template #default="scope">
               <dict-tag :options="sys_common_status" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Execution Time" align="center" prop="createTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Operation" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['monitor:job:query']">Details</el-button>
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

      <!-- Schedule Log Details -->
      <el-dialog title="Schedule Log Details" v-model="open" width="700px" append-to-body>
         <el-form :model="form" label-width="100px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="Log ID:">{{ form.jobLogId }}</el-form-item>
                  <el-form-item label="Job Name:">{{ form.jobName }}</el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Job Group:">{{ form.jobGroup }}</el-form-item>
                  <el-form-item label="Execution Time:">{{ form.createTime }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Invoke Method:">{{ form.invokeTarget }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Log Message:">{{ form.jobMessage }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Execution Status:">
                     <div v-if="form.status == 0">Normal</div>
                     <div v-else-if="form.status == 1">Failure</div>
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Exception Info:" v-if="form.status == 1">{{ form.exceptionInfo }}</el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button @click="open = false">Close</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="JobLog">
import { getJob } from "@/api/monitor/job";
import { listJobLog, delJobLog, cleanJobLog } from "@/api/monitor/jobLog";

const { proxy } = getCurrentInstance();
const { sys_common_status, sys_job_group } = proxy.useDict("sys_common_status", "sys_job_group");

const jobLogList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref([]);
const route = useRoute();

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: undefined,
    dictType: undefined,
    status: undefined
  }
});

const { queryParams, form, rules } = toRefs(data);

/** Query schedule log list */
function getList() {
  loading.value = true;
  listJobLog(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    jobLogList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// Return button
function handleClose() {
  const obj = { path: "/monitor/job" };
  proxy.$tab.closeOpenPage(obj);
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

// Selected data in the checkbox
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.jobLogId);
  multiple.value = !selection.length;
}

/** Details button operation */
function handleView(row) {
  open.value = true;
  form.value = row;
}

/** Delete button operation */
function handleDelete(row) {
  proxy.$modal.confirm('Are you sure you want to delete the schedule log with ID "' + ids.value + '"?').then(function () {
    return delJobLog(ids.value);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Delete successful");
  }).catch(() => {});
}

/** Clear button operation */
function handleClean() {
  proxy.$modal.confirm("Are you sure you want to clear all schedule log data?").then(function () {
    return cleanJobLog();
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Clear successful");
  }).catch(() => {});
}

/** Export button operation */
function handleExport() {
  proxy.download("schedule/job/log/export", {
    ...queryParams.value,
  }, `job_log_${new Date().getTime()}.xlsx`);
}

(() => {
  const jobId = route.params && route.params.jobId;
  if (jobId !== undefined && jobId != 0) {
    getJob(jobId).then(response => {
      queryParams.value.jobName = response.data.jobName;
      queryParams.value.jobGroup = response.data.jobGroup;
      getList();
    });
  } else {
    getList();
  }
})();

</script>
