<script setup>
import { ref, onMounted, computed } from 'vue'

const API_BASE = 'http://localhost:5000'

const profileForm = ref({
  id: '',
  username: '',
  email: '',
  photo: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const toast = ref({ show: false, message: '', type: 'success' })
const loading = ref(false)
const avatarHover = ref(false)
const fileInput = ref(null)

const avatarText = computed(() => {
  const name = profileForm.value.username || ''
  return name.charAt(0).toUpperCase()
})

const avatarUrl = computed(() => {
  if (profileForm.value.photo) {
    return `${API_BASE}/api/uploads/accounts/${profileForm.value.photo}`
  }
  return ''
})

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// 页面加载时获取个人信息
onMounted(async () => {
  try {
    const token = localStorage.getItem('user_token')
    const res = await fetch(`${API_BASE}/api/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok && data.data) {
      profileForm.value.id = data.data.id
      profileForm.value.username = data.data.username
      profileForm.value.email = data.data.email
      profileForm.value.photo = data.data.photo || ''
    } else {
      showToast(data.message || '获取个人信息失败', 'error')
    }
  } catch (err) {
    console.error('加载个人信息失败:', err)
    showToast('网络错误，请稍后重试', 'error')
  }
})

// 点击头像触发文件选择
const triggerFileInput = () => {
  fileInput.value && fileInput.value.click()
}

// 选择文件后上传
const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('photo', file)
  try {
    const token = localStorage.getItem('user_token')
    const accountId = profileForm.value.id
    const res = await fetch(`${API_BASE}/api/accounts/${accountId}/photo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    if (res.ok) {
      profileForm.value.photo = data.photo
      showToast('头像上传成功', 'success')
    } else {
      showToast(data.message || '头像上传失败', 'error')
    }
  } catch (err) {
    console.error(err)
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    // 清空 input，允许重复选同一文件
    e.target.value = ''
  }
}

// 保存基本信息
const saveProfile = async () => {
  if (!profileForm.value.username.trim()) {
    showToast('用户名不能为空', 'error')
    return
  }
  loading.value = true
  try {
    const token = localStorage.getItem('user_token')
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: profileForm.value.username.trim(),
        email: profileForm.value.email.trim()
      })
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('user_name', data.data.username)
      showToast('个人信息保存成功', 'success')
    } else {
      showToast(data.message || '保存失败', 'error')
    }
  } catch (err) {
    console.error(err)
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('两次输入的新密码不一致', 'error')
    return
  }
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    showToast('请填写所有密码字段', 'error')
    return
  }
  loading.value = true
  try {
    const token = localStorage.getItem('user_token')
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    })
    const data = await res.json()
    if (res.ok) {
      showToast('密码修改成功', 'success')
      passwordForm.value.currentPassword = ''
      passwordForm.value.newPassword = ''
      passwordForm.value.confirmPassword = ''
    } else {
      showToast(data.message || '密码修改失败', 'error')
    }
  } catch (err) {
    console.error(err)
    showToast('网络错误，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <h2 class="page-title">个人信息</h2>

    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <div
        class="avatar"
        @click="triggerFileInput"
        @mouseenter="avatarHover = true"
        @mouseleave="avatarHover = false"
      >
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
        <span v-else class="avatar-text">{{ avatarText }}</span>
        <div class="avatar-overlay" :class="{ visible: avatarHover }">更换头像</div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display:none"
        @change="onFileChange"
      />
      <div class="form-group">
        <label>账号编号</label>
        <input v-model="profileForm.id" type="text" disabled />
      </div>
      <div class="form-group">
        <label>用户名</label>
        <input v-model="profileForm.username" type="text" placeholder="请输入用户名" />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input v-model="profileForm.email" type="email" placeholder="请输入邮箱" />
      </div>
      <button class="btn-save" @click="saveProfile" :disabled="loading">
        {{ loading ? '保存中...' : '保存修改' }}
      </button>
    </div>

    <!-- 修改密码卡片 -->
    <div class="profile-card">
      <h3 class="card-title">修改密码</h3>
      <div class="form-group">
        <label>当前密码</label>
        <input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" />
      </div>
      <div class="form-group">
        <label>新密码</label>
        <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
      </div>
      <div class="form-group">
        <label>确认新密码</label>
        <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
      </div>
      <button class="btn-save" @click="changePassword" :disabled="loading">
        {{ loading ? '修改中...' : '修改密码' }}
      </button>
    </div>

    <!-- Toast 提示 -->
    <div class="toast" :class="[toast.type, { show: toast.show }]">{{ toast.message }}</div>
  </div>
</template>

<style scoped>
.profile-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-align: center;
}

.profile-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(91, 140, 110, 0.12);
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  user-select: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 0.25s;
}

.avatar:hover {
  box-shadow: 0 4px 18px rgba(91, 140, 110, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.avatar-text {
  line-height: 1;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(91, 140, 110, 0.6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
  pointer-events: none;
}

.avatar-overlay.visible {
  opacity: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  align-self: flex-start;
}

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  background: #f8f9f5;
  border: 1px solid rgba(91, 140, 110, 0.2);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 8px rgba(91, 140, 110, 0.15);
}

.form-group input:disabled {
  background: #e8ebe3;
  color: var(--text-secondary);
  cursor: not-allowed;
}

.btn-save {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--primary), #4a7a5c);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 4px;
}

.btn-save:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3);
  transform: translateY(-2px);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  z-index: 2000;
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s;
  pointer-events: none;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

.toast.success {
  background: linear-gradient(135deg, var(--success), #4a7a5c);
  box-shadow: 0 4px 20px rgba(91, 140, 110, 0.2);
}

.toast.error {
  background: linear-gradient(135deg, var(--danger), #c05050);
  box-shadow: 0 4px 20px rgba(224, 96, 96, 0.2);
}

@media (max-width: 700px) {
  .profile-view {
    padding: 16px;
  }

  .profile-card {
    padding: 20px;
  }
}
</style>
