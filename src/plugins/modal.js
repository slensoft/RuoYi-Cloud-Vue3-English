import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

let loadingInstance;

export default {
  // Message prompt
  msg(content) {
    ElMessage.info(content)
  },
  // Error message
  msgError(content) {
    ElMessage.error(content)
  },
  // Success message
  msgSuccess(content) {
    ElMessage.success(content)
  },
  // Warning message
  msgWarning(content) {
    ElMessage.warning(content)
  },
  // Popup prompt
  alert(content) {
    ElMessageBox.alert(content, "System prompt")
  },
  // Error prompt
  alertError(content) {
    ElMessageBox.alert(content, "System prompt", { type: 'error' })
  },
  // Success prompt
  alertSuccess(content) {
    ElMessageBox.alert(content, "System prompt", { type: 'success' })
  },
  // Warning prompt
  alertWarning(content) {
    ElMessageBox.alert(content, "System prompt", { type: 'warning' })
  },
  // Notification prompt
  notify(content) {
    ElNotification.info(content)
  },
  // Error notification
  notifyError(content) {
    ElNotification.error(content);
  },
  // Success notification
  notifySuccess(content) {
    ElNotification.success(content)
  },
  // Warning notification
  notifyWarning(content) {
    ElNotification.warning(content)
  },
  // Confirmation dialog
  confirm(content) {
    return ElMessageBox.confirm(content, "System prompt", {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: "warning",
    })
  },
  // Submit content
  prompt(content) {
    return ElMessageBox.prompt(content, "System prompt", {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: "warning",
    })
  },
  // Open loading overlay
  loading(content) {
    loadingInstance = ElLoading.service({
      lock: true,
      text: content,
      background: "rgba(0, 0, 0, 0.7)",
    })
  },
  // Close loading overlay
  closeLoading() {
    loadingInstance.close();
  }
}
