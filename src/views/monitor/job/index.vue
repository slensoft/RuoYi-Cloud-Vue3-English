<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="Job Name" prop="jobName">
            <el-input
               v-model="queryParams.jobName"
               placeholder="Please enter job name"
               clearable
               style="width: 200px"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Job Group Name" prop="jobGroup">
            <el-select v-model="queryParams.jobGroup" placeholder="Please select job group name" clearable style="width: 200px">
               <el-option
                  v-for="dict in sys_job_group"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="Job Status" prop="status">
            <el-select v-model="queryParams.status" placeholder="Please select job status" clearable style="width: 200px">
               <el-option
                  v-for="dict in sys_job_status"
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
               v-hasPermi="['monitor:job:add']"
            >Add</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['monitor:job:edit']"
            >Edit</el-button>
         </el-col>
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
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['monitor:job:export']"
            >Export</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="info"
               plain
               icon="Operation"
               @click="handleJobLog"
               v-hasPermi="['monitor:job:query']"
            >Log</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="jobList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="Job ID" width="100" align="center" prop="jobId" />
         <el-table-column label="Job Name" align="center" prop="jobName" :show-overflow-tooltip="true" />
         <el-table-column label="Job Group Name" align="center" prop="jobGroup">
            <template #default="scope">
               <dict-tag :options="sys_job_group" :value="scope.row.jobGroup" />
            </template>
         </el-table-column>
         <el-table-column label="Invoke Target String" align="center" prop="invokeTarget" :show-overflow-tooltip="true" />
         <el-table-column label="Cron Execution Expression" align="center" prop="cronExpression" :show-overflow-tooltip="true" />
         <el-table-column label="Status" align="center">
            <template #default="scope">
               <el-switch
                  v-model="scope.row.status"
                  active-value="0"
                  inactive-value="1"
                  @change="handleStatusChange(scope.row)"
               ></el-switch>
            </template>
         </el-table-column>
         <el-table-column label="Operations" align="center" width="200" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-tooltip content="Edit" placement="top">
                  <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['monitor:job:edit']"></el-button>
               </el-tooltip>
               <el-tooltip content="Delete" placement="top">
                  <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['monitor:job:remove']"></el-button>
               </el-tooltip>
               <el-tooltip content="Run Once" placement="top">
                  <el-button link type="primary" icon="CaretRight" @click="handleRun(scope.row)" v-hasPermi="['monitor:job:changeStatus']"></el-button>
               </el-tooltip>
               <el-tooltip content="Job Details" placement="top">
                  <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['monitor:job:query']"></el-button>
               </el-tooltip>
               <el-tooltip content="Schedule Log" placement="top">
                  <el-button link type="primary" icon="Operation" @click="handleJobLog(scope.row)" v-hasPermi="['monitor:job:query']"></el-button>
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

      <!-- Add or Edit Scheduled Job Dialog -->
      <el-dialog :title="title" v-model="open" width="820px" append-to-body>
         <el-form ref="jobRef" :model="form" :rules="rules" label-width="120px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="Job Name" prop="jobName">
                     <el-input v-model="form.jobName" placeholder="Please enter job name" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Job Group" prop="jobGroup">
                     <el-select v-model="form.jobGroup" placeholder="Please select">
                        <el-option
                           v-for="dict in sys_job_group"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                        ></el-option>
                     </el-select>
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item prop="invokeTarget">
                     <template #label>
                        <span>
                           Invoke Method
                           <el-tooltip placement="top">
                              <template #content>
                                 <div>
                                    Bean call example: ryTask.ryParams('ry')
                                    <br />Class call example: com.ruoyi.quartz.task.RyTask.ryParams('ry')
                                    <br />Parameter description: Supports string, boolean, long, float, integer
                                 </div>
                              </template>
                              <el-icon><question-filled /></el-icon>
                           </el-tooltip>
                        </span>
                     </template>
                     <el-input v-model="form.invokeTarget" placeholder="Please enter invoke target string" />
                  </el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Cron Expression" prop="cronExpression">
                     <el-input v-model="form.cronExpression" placeholder="Please enter cron execution expression">
                        <template #append>
                           <el-button type="primary" @click="handleShowCron">
                              Generate Expression
                              <i class="el-icon-time el-icon--right"></i>
                           </el-button>
                        </template>
                     </el-input>
                  </el-form-item>
               </el-col>
               <el-col :span="24" v-if="form.jobId !== undefined">
                  <el-form-item label="Status">
                     <el-radio-group v-model="form.status">
                        <el-radio
                           v-for="dict in sys_job_status"
                           :key="dict.value"
                           :label="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Execution Policy" prop="misfirePolicy">
                     <el-radio-group v-model="form.misfirePolicy">
                        <el-radio-button label="1">Execute Immediately</el-radio-button>
                        <el-radio-button label="2">Execute Once</el-radio-button>
                        <el-radio-button label="3">Abandon Execution</el-radio-button>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Concurrent" prop="concurrent">
                     <el-radio-group v-model="form.concurrent">
                        <el-radio-button label="0">Allow</el-radio-button>
                        <el-radio-button label="1">Prohibit</el-radio-button>
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

     <el-dialog title="Cron Expression Generator" v-model="openCron" append-to-body destroy-on-close>
       <crontab ref="crontabRef" @hide="openCron=false" @fill="crontabFill" :expression="expression"></crontab>
     </el-dialog>

      <!-- Job Log Details -->
      <el-dialog title="Job Details" v-model="openView" width="700px" append-to-body>
         <el-form :model="form" label-width="120px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="Job ID:">{{ form.jobId }}</el-form-item>
                  <el-form-item label="Job Name:">{{ form.jobName }}</el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Job Group:">{{ jobGroupFormat(form) }}</el-form-item>
                  <el-form-item label="Creation Time:">{{ form.createTime }}</el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Cron Expression:">{{ form.cronExpression }}</el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Next Execution Time:">{{ parseTime(form.nextValidTime) }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Invoke Target Method:">{{ form.invokeTarget }}</el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Job Status:">
                     <div v-if="form.status == 0">Normal</div>
                     <div v-else-if="form.status == 1">Paused</div>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Concurrent:">
                     <div v-if="form.concurrent == 0">Allow</div>
                     <div v-else-if="form.concurrent == 1">Prohibit</div>
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Execution Policy:">
                     <div v-if="form.misfirePolicy == 0">Default Policy</div>
                     <div v-else-if="form.misfirePolicy == 1">Execute Immediately</div>
                     <div v-else-if="form.misfirePolicy == 2">Execute Once</div>
                     <div v-else-if="form.misfirePolicy == 3">Abandon Execution</div>
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button @click="openView = false">Close</el-button>
            </div>
         </template>
      </el-dialog>
   </div>
</template>

<script setup name="Job">
import { listJob, getJob, delJob, addJob, updateJob, runJob, changeJobStatus } from "@/api/monitor/job";
import Crontab from '@/components/Crontab'
const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_job_group, sys_job_status } = proxy.useDict("sys_job_group", "sys_job_status");

const jobList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const openView = ref(false);
const openCron = ref(false);
const expression = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    jobName: undefined,
    jobGroup: undefined,
    status: undefined
  },
  rules: {
    jobName: [{ required: true, message: "Job name cannot be empty", trigger: "blur" }],
    invokeTarget: [{ required: true, message: "Invoke target string cannot be empty", trigger: "blur" }],
    cronExpression: [{ required: true, message: "Cron execution expression cannot be empty", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** Query scheduled job list */
function getList() {
  loading.value = true;
  listJob(queryParams.value).then(response => {
    jobList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Job group name dictionary translation */
function jobGroupFormat(row, column) {
  return proxy.selectDictLabel(sys_job_group.value, row.jobGroup);
}

/** Cancel button */
function cancel() {
  open.value = false;
  reset();
}

/** Form reset */
function reset() {
  form.value = {
    jobId: undefined,
    jobName: undefined,
    jobGroup: undefined,
    invokeTarget: undefined,
    cronExpression: undefined,
    misfirePolicy: 1,
    concurrent: 1,
    status: "0"
  };
  proxy.resetForm("jobRef");
}

/** Search button operation */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** Reset button operation */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// Selected data in the checkbox
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.jobId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

// Trigger more operations
function handleCommand(command, row) {
  switch (command) {
    case "handleRun":
      handleRun(row);
      break;
    case "handleView":
      handleView(row);
      break;
    case "handleJobLog":
      handleJobLog(row);
      break;
    default:
      break;
  }
}

// Job status modification
function handleStatusChange(row) {
  let text = row.status === "0" ? "Enable" : "Disable";
  proxy.$modal.confirm('Are you sure you want to "' + text + '" the "' + row.jobName + '" job?').then(function () {
    return changeJobStatus(row.jobId, row.status);
  }).then(() => {
    proxy.$modal.msgSuccess(text.charAt(0).toUpperCase() + text.slice(1) + "d successfully");
  }).catch(function () {
    row.status = row.status === "0" ? "1" : "0";
  });
}

/* Execute once immediately */
function handleRun(row) {
  proxy.$modal.confirm('Are you sure you want to execute the "' + row.jobName + '" job once immediately?').then(function () {
    return runJob(row.jobId, row.jobGroup);
  }).then(() => {
    proxy.$modal.msgSuccess("Execution successful");})
  .catch(() => {});
}

/** Job details */
function handleView(row) {
  getJob(row.jobId).then(response => {
    form.value = response.data;
    openView.value = true;
  });
}

/** Cron expression button operation */
function handleShowCron() {
  expression.value = form.value.cronExpression;
  openCron.value = true;
}

/** Return value after confirmation */
function crontabFill(value) {
  form.value.cronExpression = value;
}

/** Job log list query */
function handleJobLog(row) {
  const jobId = row.jobId || 0;
  router.push('/monitor/job-log/index/' + jobId)
}

/** Add button operation */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "Add Job";
}

/** Edit button operation */
function handleUpdate(row) {
  reset();
  const jobId = row.jobId || ids.value;
  getJob(jobId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "Edit Job";
  });
}

/** Submit button */
function submitForm() {
  proxy.$refs["jobRef"].validate(valid => {
    if (valid) {
      if (form.value.jobId != undefined) {
        updateJob(form.value).then(response => {
          proxy.$modal.msgSuccess("Edit successful");
          open.value = false;
          getList();
        });
      } else {
        addJob(form.value).then(response => {
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
  const jobIds = row.jobId || ids.value;
  proxy.$modal.confirm('Are you sure you want to delete the scheduled job with ID "' + jobIds + '"?').then(function () {
    return delJob(jobIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Delete successful");
  }).catch(() => {});
}

/** Export button operation */
function handleExport() {
  proxy.download("schedule/job/export", {
    ...queryParams.value,
  }, `job_${new Date().getTime()}.xlsx`);
}

getList();
</script>
