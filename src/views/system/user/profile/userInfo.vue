<template>
   <el-form ref="userRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="Nickname" prop="nickName">
         <el-input v-model="form.nickName" maxlength="30" />
      </el-form-item>
      <el-form-item label="Phone Number" prop="phonenumber">
         <el-input v-model="form.phonenumber" maxlength="11" />
      </el-form-item>
      <el-form-item label="Email" prop="email">
         <el-input v-model="form.email" maxlength="50" />
      </el-form-item>
      <el-form-item label="Gender">
         <el-radio-group v-model="form.sex">
            <el-radio value="0">Male</el-radio>
            <el-radio value="1">Female</el-radio>
         </el-radio-group>
      </el-form-item>
      <el-form-item>
      <el-button type="primary" @click="submit">Save</el-button>
      <el-button type="danger" @click="close">Close</el-button>
      </el-form-item>
   </el-form>
</template>

<script setup>
import { updateUserProfile } from "@/api/system/user";

const props = defineProps({
  user: {
    type: Object
  }
});

const { proxy } = getCurrentInstance();

const form = ref({});
const rules = ref({
  nickName: [{ required: true, message: "The user nickname cannot be empty", trigger: "blur" }],
  email: [{ required: true, message: "Email address cannot be empty", trigger: "blur" }, { type: "email", message: "Please enter a valid email address", trigger: ["blur", "change"] }],
  phonenumber: [{ required: true, message: "Phone number cannot be empty", trigger: "blur" }, { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "Please enter a valid phone number", trigger: "blur" }],
});

/** Submit button */
function submit() {
  proxy.$refs.userRef.validate(valid => {
    if (valid) {
      updateUserProfile(form.value).then(response => {
        proxy.$modal.msgSuccess("Modified successfully");
        props.user.phonenumber = form.value.phonenumber;
        props.user.email = form.value.email;
      });
    }
  });
};

/** Close button */
function close() {
  proxy.$tab.closePage();
};

// Display current logged-in user information
watch(() => props.user, user => {
  if (user) {
    form.value = { nickName: user.nickName, phonenumber: user.phonenumber, email: user.email, sex: user.sex };
  }
},{ immediate: true });
</script>
