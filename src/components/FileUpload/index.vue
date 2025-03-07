<template>
  <div class="upload-file">
    <el-upload
      multiple
      :action="uploadFileUrl"
      :before-upload="handleBeforeUpload"
      :file-list="fileList"
      :limit="limit"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      :headers="headers"
      class="upload-file-uploader"
      ref="fileUpload"
    >
      <!-- Upload Button -->
      <el-button type="primary">Select File</el-button>  
    </el-upload>
    <!-- Upload Tip -->
    <div class="el-upload__tip" v-if="showTip">
      Please upload
      <template v-if="fileSize"> files not exceeding <b style="color: #f56c6c">{{ fileSize }}MB</b> </template>
      <template v-if="fileType"> files in <b style="color: #f56c6c">{{ fileType.join("/") }}</b> format </template>
      files
    </div>
    <!-- File List -->
    <transition-group class="upload-file-list el-upload-list el-upload-list--text" name="el-fade-in-linear" tag="ul">
      <li :key="file.uid" class="el-upload-list__item ele-upload-list__item-content" v-for="(file, index) in fileList">
        <el-link :href="file.url" :underline="false" target="_blank">
          <span class="el-icon-document"> {{ getFileName(file.name) }} </span>
        </el-link>
        <div class="ele-upload-list__item-content-action">
          <el-link :underline="false" @click="handleDelete(index)" type="danger">Delete</el-link>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script setup>
import { getToken } from "@/utils/auth";

const props = defineProps({
  modelValue: [String, Object, Array],
  // Quantity Limit
  limit: {
    type: Number,
    default: 5,
  },
  // Size Limit (MB)
  fileSize: {
    type: Number,
    default: 5,
  },
  // File Types, e.g., ['png', 'jpg', 'jpeg']
  fileType: {
    type: Array,
    default: () => ["doc", "xls", "ppt", "txt", "pdf"],
  },
  // Show Tip
  isShowTip: {
    type: Boolean,
    default: true
  }
});

const { proxy } = getCurrentInstance();
const emit = defineEmits();
const number = ref(0);
const uploadList = ref([]);
const uploadFileUrl = ref(import.meta.env.VITE_APP_BASE_API + "/file/upload"); // Upload File Server Address
const headers = ref({ Authorization: "Bearer " + getToken() });
const fileList = ref([]);
const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
);

watch(() => props.modelValue, val => {
  if (val) {
    let temp = 1;
    // First convert the value to an array
    const list = Array.isArray(val) ? val : props.modelValue.split(',');
    // Then convert the array to an array of objects
    fileList.value = list.map(item => {
      if (typeof item === "string") {
        item = { name: item, url: item };
      }
      item.uid = item.uid || new Date().getTime() + temp++;
      return item;
    });
  } else {
    fileList.value = [];
    return [];
  }
},{ deep: true, immediate: true });

// Check format and size before upload
function handleBeforeUpload(file) {
  // Check file type
  if (props.fileType.length) {
    const fileName = file.name.split('.');
    const fileExt = fileName[fileName.length - 1];
    const isTypeOk = props.fileType.indexOf(fileExt) >= 0;
    if (!isTypeOk) {
      proxy.$modal.msgError(`The file format is incorrect, please upload a file in the ${props.fileType.join("/")} format!`);
      return false;
    }
  }
  // Check if the file name contains special characters
  if (file.name.includes(',')) {
    proxy.$modal.msgError('The file name is incorrect, it cannot contain English commas!');
    return false;
  }
  // Check file size
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy.$modal.msgError(`The file size cannot exceed ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy.$modal.loading("Uploading file, please wait...");
  number.value++;
  return true;
}

// File count exceeded
function handleExceed() {
  proxy.$modal.msgError(`The number of uploaded files cannot exceed ${props.limit}!`);
}

// Upload failed
function handleUploadError(err) {
  proxy.$modal.msgError("Upload file failed");
}

// Upload success callback
function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    uploadList.value.push({ name: res.data.url, url: res.data.url });
    uploadedSuccessfully();
  } else {
    number.value--;
    proxy.$modal.closeLoading();
    proxy.$modal.msgError(res.msg);
    proxy.$refs.fileUpload.handleRemove(file);
    uploadedSuccessfully();
  }
}

// Delete file
function handleDelete(index) {
  fileList.value.splice(index, 1);
  emit("update:modelValue", listToString(fileList.value));
}

// Handle end of upload
function uploadedSuccessfully() {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value);
    uploadList.value = [];
    number.value = 0;
    emit("update:modelValue", listToString(fileList.value));
    proxy.$modal.closeLoading();
  }
}

// Get file name
function getFileName(name) {
  // If it's a URL, take the last name; otherwise, return directly
  if (name.lastIndexOf("/") > -1) {
    return name.slice(name.lastIndexOf("/") + 1);
  } else {
    return name;
  }
}

// Convert object to specified string separator
function listToString(list, separator) {
  let strs = "";
  separator = separator || ",";
  for (let i in list) {
    if (list[i].url) {
      strs += list[i].url + separator;
    }
  }
  return strs != '' ? strs.substr(0, strs.length - 1) : '';
}
</script>

<style scoped lang="scss">
.upload-file-uploader {
  margin-bottom: 5px;
}
.upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
}
.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}
.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}
</style>
