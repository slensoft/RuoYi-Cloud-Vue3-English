<template>
  <div class="user-info-head" @click="editCropper()">
    <img :src="options.img" title="Click to upload avatar" class="img-circle img-lg" />
    <el-dialog :title="title" v-model="open" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :autoCrop="options.autoCrop"
            :autoCropWidth="options.autoCropWidth"
            :autoCropHeight="options.autoCropHeight"
            :fixedBox="options.fixedBox"
            :outputType="options.outputType"
            @realTime="realTime"
            v-if="visible"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <div class="avatar-upload-preview">
            <img :src="options.previews.url" :style="options.previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload
            action="#"
            :http-request="requestUpload"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <el-button>
              Select
              <el-icon class="el-icon--right"><Upload /></el-icon>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{ span: 1, offset: 2 }" :md="2">
          <el-button icon="Plus" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="Minus" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshRight" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{ span: 2, offset: 6 }" :md="2">
          <el-button type="primary" @click="uploadImg()">Submit</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import "vue-cropper/dist/index.css";
import { VueCropper } from "vue-cropper";
import { uploadAvatar } from "@/api/system/user";
import useUserStore from "@/store/modules/user";

const userStore = useUserStore();
const { proxy } = getCurrentInstance();

const open = ref(false);
const visible = ref(false);
const title = ref("Change Avatar");

// Image cropping data
const options = reactive({
  img: userStore.avatar,     // Image URL for cropping
  autoCrop: true,            // Whether to automatically generate crop box
  autoCropWidth: 200,        // Default crop box width
  autoCropHeight: 200,       // Default crop box height
  fixedBox: true,            // Fix crop box size, not allowed to change
  outputType: "png",         // Default output format is PNG
  filename: 'avatar',        // File name
  previews: {}               // Preview data
});

/** Edit avatar */
function editCropper() {
  open.value = true;
}

/** Callback when modal is opened */
function modalOpened() {
  visible.value = true;
}

/** Override default upload behavior */
function requestUpload() {}

/** Rotate left */
function rotateLeft() {
  proxy.$refs.cropper.rotateLeft();
}

/** Rotate right */
function rotateRight() {
  proxy.$refs.cropper.rotateRight();
}

/** Image scaling */
function changeScale(num) {
  num = num || 1;
  proxy.$refs.cropper.changeScale(num);
}

/** Upload preprocessing */
function beforeUpload(file) {
  if (file.type.indexOf("image/") == -1) {
    proxy.$modal.msgError("File format error, please upload image files like JPG or PNG.");
  } else {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      options.img = reader.result;
      options.filename = file.name;
    };
  }
}

/** Upload image */
function uploadImg() {
  proxy.$refs.cropper.getCropBlob(data => {
    let formData = new FormData();
    formData.append("avatarfile", data, options.filename);
    uploadAvatar(formData).then(response => {
      open.value = false;
      options.img = response.imgUrl;
      userStore.avatar = options.img;
      proxy.$modal.msgSuccess("Modified successfully");
      visible.value = false;
    });
  });
}

/** Real-time preview */
function realTime(data) {
  options.previews = data;
}

/** Close dialog */
function closeDialog() {
  options.img = userStore.avatar;
  options.visible = false;
}
</script>

<style lang='scss' scoped>
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: "+";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}
</style>