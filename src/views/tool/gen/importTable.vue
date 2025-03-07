<template>
  <!-- Import Table -->
  <el-dialog title="Import Table" v-model="visible" width="800px" top="5vh" append-to-body>
    <el-form :model="queryParams" ref="queryRef" :inline="true">
      <el-form-item label="Table Name" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="Please enter table name"
          clearable
          style="width: 180px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="Table Description" prop="tableComment">
        <el-input
          v-model="queryParams.tableComment"
          placeholder="Please enter table description"
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
      <el-table @row-click="clickRow" ref="table" :data="dbTableList" @selection-change="handleSelectionChange" height="260px">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="tableName" label="Table Name" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="tableComment" label="Table Description" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="createTime" label="Create Time"></el-table-column>
        <el-table-column prop="updateTime" label="Update Time"></el-table-column>
      </el-table>
      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-row>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleImportTable">Confirm</el-button>
        <el-button @click="visible = false">Cancel</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { listDbTable, importTable } from "@/api/tool/gen";

const total = ref(0);
const visible = ref(false);
const tables = ref([]);
const dbTableList = ref([]);
const { proxy } = getCurrentInstance();

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  tableName: undefined,
  tableComment: undefined
});

const emit = defineEmits(["ok"]);

/** Query parameter list */
function show() {
  getList();
  visible.value = true;
}

/** Click to select row */
function clickRow(row) {
  proxy.$refs.table.toggleRowSelection(row);
}

/** Multiple selection change */
function handleSelectionChange(selection) {
  tables.value = selection.map(item => item.tableName);
}

/** Query table data */
function getList() {
  listDbTable(queryParams).then(res => {
    dbTableList.value = res.rows;
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

/** Import button operation */
function handleImportTable() {
  const tableNames = tables.value.join(",");
  if (tableNames == "") {
    proxy.$modal.msgError("Please select tables to import");
    return;
  }
  importTable({ tables: tableNames }).then(res => {
    proxy.$modal.msgSuccess(res.msg);
    if (res.code === 200) {
      visible.value = false;
      emit("ok");
    }
  });
}

defineExpose({
  show,
});
</script>
