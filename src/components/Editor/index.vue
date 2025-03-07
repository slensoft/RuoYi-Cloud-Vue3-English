<template>
  <div>
    <el-upload
      :action="uploadUrl"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      name="file"
      :show-file-list="false"
      :headers="headers"
      class="editor-img-uploader"
      v-if="type == 'url'"
    >
      <i ref="uploadRef" class="editor-img-uploader"></i>
    </el-upload>
  </div>
  <div class="editor">
    <quill-editor
      ref="quillEditorRef"
      v-model:content="content"
      contentType="html"
      @textChange="(e) => $emit('update:modelValue', content)"
      :options="options"
      :style="styles"
    />
  </div>
</template>

<script setup>
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { getToken } from "@/utils/auth";

const { proxy } = getCurrentInstance();

const quillEditorRef = ref();
const uploadUrl = ref(import.meta.env.VITE_APP_BASE_API + "/file/upload"); // Upload Image Server Address
const headers = ref({
  Authorization: "Bearer " + getToken()
});

const props = defineProps({
  /* Editor Content */
  modelValue: {
    type: String,
  },
  /* Height */
  height: {
    type: Number,
    default: null,
  },
  /* Minimum Height */
  minHeight: {
    type: Number,
    default: null,
  },
  /* Read Only */
  readOnly: {
    type: Boolean,
    default: false,
  },
  /* File Size Limit (MB) */
  fileSize: {
    type: Number,
    default: 5,
  },
  /* Type (base64 format, url format) */
  type: {
    type: String,
    default: "url",
  }
});

const options = ref({
  theme: "snow",
  bounds: document.body,
  debug: "warn",
  modules: {
    // Toolbar Configuration
    toolbar: [
      ["bold", "italic", "underline", "strike"],      // Bold Italic Underline Strikethrough
      ["blockquote", "code-block"],                   // Blockquote Code Block
      [{ list: "ordered" }, { list: "bullet" }],      // Ordered, Unordered List
      [{ indent: "-1" }, { indent: "+1" }],           // Indent
      [{ size: ["small", false, "large", "huge"] }],  // Font Size
      [{ header: [1, 2, 3, 4, 5, 6, false] }],        // Header
      [{ color: [] }, { background: [] }],            // Font Color, Font Background Color
      [{ align: [] }],                                // Alignment
      ["clean"],                                      // Clean Text Format
      ["link", "image", "video"]                      // Link, Image, Video
    ],
  },
  placeholder: "Please enter content",
  readOnly: props.readOnly
});

const styles = computed(() => {
  let style = {};
  if (props.minHeight) {
    style.minHeight = `${props.minHeight}px`;
  }
  if (props.height) {
    style.height = `${props.height}px`;
  }
  return style;
});

const content = ref("");
watch(() => props.modelValue, (v) => {
  if (v !== content.value) {
    content.value = v === undefined ? "<p></p>" : v;
  }
}, { immediate: true });

// If the upload address is set, customize the image upload event
onMounted(() => {
  if (props.type == 'url') {
    let quill = quillEditorRef.value.getQuill();
    let toolbar = quill.getModule("toolbar");
    toolbar.addHandler("image", (value) => {
      if (value) {
        proxy.$refs.uploadRef.click();
      } else {
        quill.format("image", false);
      }
    });
  }
});

// Check format and size before upload
function handleBeforeUpload(file) {
  const type = ["image/jpeg", "image/jpg", "image/png", "image/svg"];
  const isJPG = type.includes(file.type);
  // Check file format
  if (!isJPG) {
    proxy.$modal.msgError(`Image format error!`);
    return false;
  }
  // Check file size
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize;
    if (!isLt) {
      proxy.$modal.msgError(`File size cannot exceed ${props.fileSize} MB!`);
      return false;
    }
  }
  return true;
}

// Handle upload success
function handleUploadSuccess(res, file) {
  // If upload is successful
  if (res.code == 200) {
    // Get rich text instance
    let quill = toRaw(quillEditorRef.value).getQuill();
    // Get cursor position
    let length = quill.selection.savedRange.index;
    // Insert image, res.url is the image link address returned by the server
    quill.insertEmbed(length, "image", res.data.url);
    // Move cursor to the end
    quill.setSelection(length + 1);
  } else {
    proxy.$modal.msgError("Image insertion failed");
  }
}

// Handle upload failure
function handleUploadError() {
  proxy.$modal.msgError("Image insertion failed");
}
</script>

<style>
.editor-img-uploader {
  display: none;
}
.editor, .ql-toolbar {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode="link"]::before {
  content: "Please enter link address:";
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0px;
  content: "Save";
  padding-right: 0px;
}
.ql-snow .ql-tooltip[data-mode="video"]::before {
  content: "Please enter video address:";
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: "14px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
  content: "10px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
  content: "18px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
  content: "32px";
}
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: "Text";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
  content: "Header 1";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
  content: "Header 2";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
  content: "Header 3";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before {
  content: "Header 4";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before {
  content: "Header 5";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="6"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="6"]::before {
  content: "Header 6";
}
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: "Standard Font";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
  content: "Serif Font";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
  content: "Monospace Font";
}
</style>
