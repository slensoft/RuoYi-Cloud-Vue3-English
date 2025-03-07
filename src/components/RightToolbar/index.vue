<template>
  <div class="top-right-btn" :style="style">
    <el-row>
      <el-tooltip class="item" effect="dark" :content="showSearch ? 'Hide Search' : 'Show Search'" placement="top" v-if="search">
        <el-button circle icon="Search" @click="toggleSearch()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="Refresh" placement="top">
        <el-button circle icon="Refresh" @click="refresh()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="Show/Hide Columns" placement="top" v-if="columns">
        <el-button circle icon="Menu" @click="showColumn()" v-if="showColumnsType == 'transfer'"/>
        <el-dropdown trigger="click" :hide-on-click="false" style="padding-left: 12px" v-if="showColumnsType == 'checkbox'">
          <el-button circle icon="Menu" />
          <template #dropdown>
            <el-dropdown-menu>
              <template v-for="item in columns" :key="item.key">
                <el-dropdown-item>
                  <el-checkbox :checked="item.visible" @change="checkboxChange($event, item.label)" :label="item.label" />
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tooltip>
    </el-row>
    <el-dialog :title="title" v-model="open" append-to-body>
      <el-transfer
        :titles="['Show', 'Hide']"
        v-model="value"
        :data="columns"
        @change="dataChange"
      ></el-transfer>
    </el-dialog>
  </div>
</template>

<script setup>
const props = defineProps({
  /* Show Search Conditions */
  showSearch: {
    type: Boolean,
    default: true,
  },
  /* Show/Hide Column Information */
  columns: {
    type: Array,
  },
  /* Show Search Icon */
  search: {
    type: Boolean,
    default: true,
  },
  /* Show/Hide Column Type (transfer shuttle box, checkbox) */
  showColumnsType: {
    type: String,
    default: "checkbox",
  },
  /* Right Margin */
  gutter: {
    type: Number,
    default: 10,
  },
})

const emits = defineEmits(['update:showSearch', 'queryTable']);

// Show/Hide Data
const value = ref([]);
// Dialog Title
const title = ref("Show/Hide");
// Show Dialog
const open = ref(false);

const style = computed(() => {
  const ret = {};
  if (props.gutter) {
    ret.marginRight = `${props.gutter / 2}px`;
  }
  return ret;
});

// Search
function toggleSearch() {
  emits("update:showSearch", !props.showSearch);
}

// Refresh
function refresh() {
  emits("queryTable");
}

// Right List Element Change
function dataChange(data) {
  for (let item in props.columns) {
    const key = props.columns[item].key;
    props.columns[item].visible = !data.includes(key);
  }
}

// Open Show/Hide Column Dialog
function showColumn() {
  open.value = true;
}

if (props.showColumnsType == 'transfer') {
  // Initial Default Hidden Columns
  for (let item in props.columns) {
    if (props.columns[item].visible === false) {
      value.value.push(parseInt(item));
    }
  }
}

// Checkbox
function checkboxChange(event, label) {
  props.columns.filter(item => item.label == label)[0].visible = event;
}

</script>

<style lang='scss' scoped>
:deep(.el-transfer__button) {
  border-radius: 50%;
  display: block;
  margin-left: 0px;
}
:deep(.el-transfer__button:first-child) {
  margin-bottom: 10px;
}
:deep(.el-dropdown-menu__item) {
  line-height: 30px;
  padding: 0 17px;
}
</style>
