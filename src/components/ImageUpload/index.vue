<template>
  <div class="component-upload-image">
    <el-upload
      multiple
      :action="uploadImgUrl"
      list-type="picture-card"
      :on-success="handleUploadSuccess"
      :before-upload="handleBeforeUpload"
      :limit="limit"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      ref="imageUpload"
      :before-remove="handleDelete"
      :show-file-list="true"
      :headers="headers"
      :file-list="fileList"
      :on-preview="handlePictureCardPreview"
      :class="{ hide: fileList.length >= limit }"
    >
      <el-icon class="avatar-uploader-icon"><plus /></el-icon>
    </el-upload>
    <!-- Upload Tip -->
    <div class="el-upload__tip" v-if="showTip">
      Please upload
      <template v-if="fileSize">
        Size not exceeding <b style="color: #f56c6c">{{ fileSize }}MB</b>
      </template>
      <template v-if="fileType">
        Format as <b style="color: #f56c6c">{{ fileType.join("/") }}</b>
      </template>
      files
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="Preview"
      width="800px"
      append-to-body
    >
      <img
        :src="dialogImageUrl"
        style="display: block; max-width: 100%; margin: 0 auto"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { getToken } from "@/utils/auth";

const props = defineProps({
  modelValue: [String, Object, Array],
  // Image Quantity Limit
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
    default: () => ["png", "jpg", "jpeg"],
  },
  // Show Tip
  isShowTip: {
    type: Boolean,
    default: true
  },
});

const { proxy } = getCurrentInstance();
const emit = defineEmits();
const number = ref(0);
const uploadList = ref([]);
const dialogImageUrl = ref("");
const dialogVisible = ref(false);
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const uploadImgUrl = ref(import.meta.env.VITE_APP_BASE_API + "/file/upload"); // Upload Image Server Address
const headers = ref({ Authorization: "Bearer " + getToken() });
const fileList = ref([]);
const showTip = computed(
  () => props.isShowTip && (props.fileType || props.fileSize)
);

watch(() => props.modelValue, val => {
  if (val) {
    // First convert the value to an array
    const list = Array.isArray(val) ? val : props.modelValue.split(",");
    // Then convert the array to an array of objects
    fileList.value = list.map(item => {
      if (typeof item === "string") {
        item = { name: item, url: item };
      }
      return item;
    });
  } else {
    fileList.value = [];
    return [];
  }
},{ deep: true, immediate: true });

// Loading before upload
function handleBeforeUpload(file) {
  let isImg = false;
  if (props.fileType.length) {
    let fileExtension = "";
    if (file.name.lastIndexOf(".") > -1) {
      fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
    }
    isImg = props.fileType.some(type => {
      if (file.type.indexOf(type) > -1) return true;
      if (fileExtension && fileExtension.indexOf(type) > -1) return true;
      return false;
    });
  } else {
    isImg = file.type.indexOf("image") > -1;
  }
  if (!isImg) {
    proxy.$modal.msgError(`The file format is incorrect, please upload a file in the ${props.fileType.join("/")} format!`);
    return false;
  }
  if (file.name.includes(',')) {
    proxy.$modal.msgError('The file name is incorrect, it cannot contain English commas!');
    return false;
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy.$modal.msgError(`The file size cannot exceed ${props.fileSize} MB!`);
      return false;
    }
  }
  proxy.$modal.loading("Uploading image, please wait...");
  number.value++;
}

// File count exceeded
function handleExceed() {
  proxy.$modal.msgError(`The number of uploaded files cannot exceed ${props.limit}!`);
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
    proxy.$refs.imageUpload.handleRemove(file);
    uploadedSuccessfully();
  }
}

// Delete image
function handleDelete(file) {
  const findex = fileList.value.map(f => f.name).indexOf(file.name);
  if (findex > -1 && uploadList.value.length === number.value) {
    fileList.value.splice(findex, 1);
    emit("update:modelValue", listToString(fileList.value));
    return false;
  }
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

// Upload failed
function handleUploadError() {
  proxy.$modal.msgError("Upload image failed");
  proxy.$modal.closeLoading();
}

// Preview
function handlePictureCardPreview(file) {
  dialogImageUrl.value = file.url;
  dialogVisible.value = true;
}

// Convert object to specified string separator
function listToString(list, separator) {
  let strs = "";
  separator = separator || ",";
  for (let i in list) {
    if (undefined !== list[i].url && list[i].url.indexOf("blob:") !== 0) {
      strs += list[i].url.replace(baseUrl, "") + separator;
    }
  }
  return strs != "" ? strs.substr(0, strs.length - 1) : "";
}
</script>

<style scoped lang="scss">
// .el-upload--picture-card controls the plus part
:deep(.hide .el-upload--picture-card) {
    display: none;
}
</style>