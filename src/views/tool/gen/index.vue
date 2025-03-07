<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="Table Name" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="Please enter table name"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="Table Description" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="Please enter table description"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
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
          icon="Download"
          @click="handleGenTable"
          v-hasPermi="['tool:gen:code']"
        >Generate</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Upload"
          @click="openImportTable"
          v-hasPermi="['tool:gen:import']"
        >Import</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleEditTable"
          v-hasPermi="['tool:gen:edit']"
        >Modify</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['tool:gen:remove']"
        >Delete</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" align="center" width="55"></el-table-column>
      <el-table-column label="No." type="index" width="50" align="center">
        <template #default="scope">
          <span>{{(queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1}}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="Table Name"
        align="center"
        prop="tableName"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="Table Description"
        align="center"
        prop="tableComment"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="Entity"
        align="center"
        prop="className"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="Create Time" align="center" prop="createTime" width="160" />
      <el-table-column label="Update Time" align="center" prop="updateTime" width="160" />
      <el-table-column label="Operations" align="center" width="330" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="Preview" placement="top">
            <el-button link type="primary" icon="View" @click="handlePreview(scope.row)" v-hasPermi="['tool:gen:preview']"></el-button>
          </el-tooltip>
          <el-tooltip content="Edit" placement="top">
            <el-button link type="primary" icon="Edit" @click="handleEditTable(scope.row)" v-hasPermi="['tool:gen:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="Delete" placement="top">
            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['tool:gen:remove']"></el-button>
          </el-tooltip>
          <el-tooltip content="Sync" placement="top">
            <el-button link type="primary" icon="Refresh" @click="handleSynchDb(scope.row)" v-hasPermi="['tool:gen:edit']"></el-button>
          </el-tooltip>
          <el-tooltip content="Generate Code" placement="top">
            <el-button link type="primary" icon="Download" @click="handleGenTable(scope.row)" v-hasPermi="['tool:gen:code']"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
    <!-- Preview Interface -->
    <el-dialog :title="preview.title" v-model="preview.open" width="80%" top="5vh" append-to-body class="scrollbar">
      <el-tabs v-model="preview.activeName">
        <el-tab-pane
          v-for="(value, key) in preview.data"
          :label="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :name="key.substring(key.lastIndexOf('/')+1,key.indexOf('.vm'))"
          :key="value"
        >
          <el-link :underline="false" icon="DocumentCopy" v-copyText="value" v-copyText:callback="copyTextSuccess" style="float:right">&nbsp;Copy</el-link>
          <pre>{{ value }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <import-table ref="importRef" @ok="handleQuery" />
  </div>
</template>

<script setup name="Gen">
import { listTable, previewTable, delTable, genCode, synchDb } from "@/api/tool/gen";
import router from "@/router";
import importTable from "./importTable";

const route = useRoute();
const { proxy } = getCurrentInstance();

const tableList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const tableNames = ref([]);
const dateRange = ref([]);
const uniqueId = ref("");

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    tableName: undefined,
    tableComment: undefined
  },
  preview: {
    open: false,
    title: "Code Preview",
    data: {},
    activeName: "domain.java"
  }
});

const { queryParams, preview } = toRefs(data);

onActivated(() => {
  const time = route.query.t;
  if (time != null && time != uniqueId.value) {
    uniqueId.value = time;
    queryParams.value.pageNum = Number(route.query.pageNum);
    dateRange.value = [];
    proxy.resetForm("queryForm");
    getList();
  }
})

/** Query table collection */
function getList() {
  loading.value = true;
  listTable(proxy.addDateRange(queryParams.value, dateRange.value)).then(response => {
    tableList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** Search button operation */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** Generate code operation */
function handleGenTable(row) {
  const tbNames = row.tableName || tableNames.value;
  if (tbNames == "") {
    proxy.$modal.msgError("Please select data to generate");
    return;
  }
  if (row.genType === "1") {
    genCode(row.tableName).then(response => {
      proxy.$modal.msgSuccess("Successfully generated to custom path: " + row.genPath);
    });
  } else {
    proxy.$download.zip("/code/gen/batchGenCode?tables=" + tbNames, "ruoyi.zip");
  }
}

/** Sync database operation */
function handleSynchDb(row) {
  const tableName = row.tableName;
  proxy.$modal.confirm('Are you sure you want to force sync the structure of table "' + tableName + '"?').then(function () {
    return synchDb(tableName);
  }).then(() => {
    proxy.$modal.msgSuccess("Sync successful");
  }).catch(() => {});
}

/** Open import table dialog */
function openImportTable() {
  proxy.$refs["importRef"].show();
}

/** Reset button operation */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

/** Preview button */
function handlePreview(row) {
  previewTable(row.tableName).then(response => {
    preview.value.data = response.data;
    preview.value.open = true;
    preview.value.activeName = "domain.java";
  });
}

/** Copy code success */
function copyTextSuccess() {
  proxy.$modal.msgSuccess("Copy successful");
}

// Checkbox selection data
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.tableId);
  tableNames.value = selection.map(item => item.tableName);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** Modify button operation */
function handleEditTable(row) {
  const tableId = row.tableId || ids.value[0];
  router.push({ path: "/tool/gen-edit/"+tableId, query: { pageNum: queryParams.value.pageNum } })
}

/** Delete button operation */
function handleDelete(row) {
  const tableIds = row.tableId || ids.value;
  proxy.$modal.confirm('Are you sure you want to delete the data with table ID "' + tableIds + '"?').then(function() {
    return delTable(tableIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("Delete successful");
  }).catch(() => {});
}

getList();
</script>
