<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
         <el-form-item label="Operation IP" prop="operIp">
            <el-input
               v-model="queryParams.operIp"
               placeholder="Please enter operation IP"
               clearable
               style="width: 240px;"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Module" prop="title">
            <el-input
               v-model="queryParams.title"
               placeholder="Please enter system module"
               clearable
               style="width: 240px;"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Operator" prop="operName">
            <el-input
               v-model="queryParams.operName"
               placeholder="Please enter operator"
               clearable
               style="width: 240px;"
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="Type" prop="businessType">
            <el-select
               v-model="queryParams.businessType"
               placeholder="Operation type"
               clearable
               style="width: 240px"
            >
               <el-option
                  v-for="dict in sys_oper_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
               />
            </el-select>
         </el-form-item>
         <el-form-item label="Status" prop="status">
            <el-select
               v-model="queryParams.status"
               placeholder="Operation status"
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
         <el-form-item label="Operation Time" style="width: 308px">
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
               v-hasPermi="['system:operlog:remove']"
            >Delete</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               @click="handleClean"
               v-hasPermi="['system:operlog:remove']"
            >Clear</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="warning"
               plain
               icon="Download"
               @click="handleExport"
               v-hasPermi="['system:operlog:export']"
            >Export</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table ref="operlogRef" v-loading="loading" :data="operlogList" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange">
         <el-table-column type="selection" width="50" align="center" />
         <el-table-column label="Log ID" align="center" prop="operId" />
         <el-table-column label="System Module" align="center" prop="title" :show-overflow-tooltip="true" />
         <el-table-column label="Operation Type" align="center" prop="businessType">
            <template #default="scope">
               <dict-tag :options="sys_oper_type" :value="scope.row.businessType" />
            </template>
         </el-table-column>
         <el-table-column label="Request Method" align="center" prop="requestMethod" />
         <el-table-column label="Operator" align="center" prop="operName" width="110" :show-overflow-tooltip="true" sortable="custom" :sort-orders="['descending', 'ascending']" />
         <el-table-column label="Operation IP" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
         <el-table-column label="Operation Status" align="center" prop="status">
            <template #default="scope">
               <dict-tag :options="sys_common_status" :value="scope.row.status" />
            </template>
         </el-table-column>
         <el-table-column label="Operation Date" align="center" prop="operTime" width="180" sortable="custom" :sort-orders="['descending', 'ascending']">
            <template #default="scope">
               <span>{{ parseTime(scope.row.operTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="Time Cost" align="center" prop="costTime" width="110" :show-overflow-tooltip="true" sortable="custom" :sort-orders="['descending', 'ascending']">
            <template #default="scope">
               <span>{{ scope.row.costTime }}ms</span>
            </template>
         </el-table-column>
         <el-table-column label="Operation" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="View" @click="handleView(scope.row, scope.index)" v-hasPermi="['system:operlog:query']">Details</el-button>
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

      <!-- Operation Log Details -->
      <el-dialog title="Operation Log Details" v-model="open" width="800px" append-to-body>
         <el-form :model="form" label-width="100px">
            <el-row>
               <el-col :span="12">
                  <el-form-item label="Module: ">{{ form.title }} / {{ typeFormat(form) }}</el-form-item>
                  <el-form-item
                    label="Login Info: "
                  >{{ form.operName }} / {{ form.operIp }} </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="Request URL: ">{{ form.operUrl }}</el-form-item>
                  <el-form-item label="Request Method: ">{{ form.requestMethod }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Operation Method: ">{{ form.method }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Request Params: ">{{ form.operParam }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Response: ">{{ form.jsonResult }}</el-form-item>
               </el-col>
               <el-col :span="8">
                  <el-form-item label="Status: ">
                     <div v-if="form.status === 0">Normal</div>
                     <div v-else-if="form.status === 1">Failure</div>
                  </el-form-item>
               </el-col>
               <el-col :span="8">
                  <el-form-item label="Time Cost: ">{{ form.costTime }}ms</el-form-item>
               </el-col>
               <el-col :span="8">
                  <el-form-item label="Operation Time: ">{{ parseTime(form.operTime) }}</el-form-item>
               </el-col>
               <el-col :span="24">
                  <el-form-item label="Error Message: " v-if="form.status === 1">{{ form.errorMsg }}</el-form-item>
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

<script setup name="Operlog">
import { list, delOperlog, cleanOperlog } from "@/api/system/operlog";

const { proxy } = getCurrentInstance();
const { sys_oper_type, sys_common_status } = proxy.useDict("sys_oper_type","sys_common_status");

const operlogList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);
const defaultSort = ref({ prop: "operTime", order: "descending" });

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: undefined,
    title: undefined,
    operName: undefined,
    businessType: undefined,
    status: undefined
  }
});

const { queryParams, form } = toRefs(data);

/** Query operation logs */
function getList() {
  loading.value = true;
  list(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    operlogList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Operation log type dictionary translation */
function typeFormat(row, column) {
  return proxy.selectDictLabel(sys_oper_type.value, row.businessType);
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
  proxy.$refs["operlogRef"].sort(defaultSort.value.prop, defaultSort.value.order);
}

/** Multiple selection box data */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.operId);
  multiple.value = !selection.length;
}

/** Sort trigger event */
function handleSortChange(column, prop, order) {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}

/** View details button operation */
function handleView(row) {
  open.value = true;
  form.value = row;
}

/** Delete button operation */
function handleDelete(row) {
  const operIds = row.operId || ids.value;
  proxy.$modal.confirm('Are you sure to delete the log with ID "' + operIds + '"?').then(function () {
    return delOperlog(operIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Deleted successfully");
  }).catch(() => {});
}

/** Clear button operation */
function handleClean() {
  proxy.$modal.confirm("Are you sure to clear all operation logs??").then(function () {
    return cleanOperlog();
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Cleared successfully");
  }).catch(() => {});
}

/** Export button operation */
function handleExport() {
  proxy.download("system/operlog/export",{
    ...queryParams.value,
  }, `config_${new Date().getTime()}.xlsx`);
}

getList();
</script>
