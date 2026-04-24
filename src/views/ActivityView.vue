<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = 'http://localhost:5000'
const activities = ref([])
const toast = ref({ show: false, message: '', type: 'success' })

// 弹窗状态
const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const showDetailModal = ref(false)
const detailActivity = ref(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref(null)
const showPhotoPreview = ref(false)
const previewPhotoUrl = ref('')

// 表单
const defaultForm = () => ({ title: '', date: '', time: '', location: '', description: '' })
const formData = ref(defaultForm())
const formErrors = ref({})

// 照片管理
const pendingPhotos = ref([])
const photoInputRef = ref(null)

// 获取 token
const getToken = () => localStorage.getItem('user_token')

// 构建照片 URL
const photoUrl = (filename) => `${API_BASE}/api/uploads/activities/${filename}`

// Toast
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// 获取活动列表
const fetchActivities = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/activities`)
    const data = await res.json()
    activities.value = Array.isArray(data) ? data : (data.data || [])
  } catch (err) {
    console.error('加载失败:', err)
    showToast('数据加载失败', 'error')
  }
}

// 打开新增弹窗
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  formData.value.date = new Date().toISOString().slice(0, 10)
  formErrors.value = {}
  pendingPhotos.value = []
  showFormModal.value = true
}

// 打开编辑弹窗
const openEditModal = (activity) => {
  isEditing.value = true
  editingId.value = activity.id
  formData.value = {
    title: activity.title,
    date: activity.date.replace(/\//g, '-'),
    time: activity.time,
    location: activity.location,
    description: activity.description
  }
  formErrors.value = {}
  pendingPhotos.value = []
  showFormModal.value = true
}

// 关闭表单弹窗
const closeFormModal = () => {
  showFormModal.value = false
  formErrors.value = {}
  pendingPhotos.value = []
}

// 打开详情弹窗
const openDetailModal = (activity) => {
  detailActivity.value = activity
  showDetailModal.value = true
}

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false
  detailActivity.value = null
}

// 表单验证
const validateForm = () => {
  const errors = {}
  if (!formData.value.title?.trim()) errors.title = '活动标题不能为空'
  if (!formData.value.date) errors.date = '日期不能为空'
  if (!formData.value.time) errors.time = '时间不能为空'
  if (!formData.value.location?.trim()) errors.location = '地点不能为空'
  if (!formData.value.description?.trim()) errors.description = '活动描述不能为空'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// 提交表单
const submitForm = async () => {
  if (!validateForm()) return
  const payload = {
    title: formData.value.title.trim(),
    date: formData.value.date.replace(/-/g, '/'),
    time: formData.value.time,
    location: formData.value.location.trim(),
    description: formData.value.description.trim()
  }
  try {
    const url = isEditing.value
      ? `${API_BASE}/api/activities/${editingId.value}`
      : `${API_BASE}/api/activities`
    const res = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      const result = await res.json().catch(() => ({}))
      const activityId = isEditing.value ? editingId.value : (result.id || result.data?.id)
      // 新增模式且有暂存照片时上传
      if (!isEditing.value && pendingPhotos.value.length > 0 && activityId) {
        await uploadPhotosToActivity(activityId)
      }
      showToast(isEditing.value ? '编辑成功' : '新增成功', 'success')
      closeFormModal()
      await fetchActivities()
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.message || '操作失败', 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('网络错误，请稍后重试', 'error')
  }
}

// 上传照片到指定活动
const uploadPhotosToActivity = async (activityId) => {
  const form = new FormData()
  pendingPhotos.value.forEach(p => form.append('photos', p.file))
  try {
    await fetch(`${API_BASE}/api/activities/${activityId}/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: form
    })
  } catch (e) {
    console.error('照片上传失败:', e)
  }
}

// 删除活动
const confirmDelete = (id) => {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

const executeDelete = async () => {
  if (!deleteTargetId.value) return
  try {
    const res = await fetch(`${API_BASE}/api/activities/${deleteTargetId.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (res.ok) {
      showToast('删除成功', 'success')
      await fetchActivities()
    } else {
      showToast('删除失败', 'error')
    }
  } catch (e) {
    showToast('删除失败', 'error')
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

// 删除单张照片
const deletePhoto = async (activityId, filename) => {
  try {
    const res = await fetch(`${API_BASE}/api/activities/${activityId}/photos/${filename}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (res.ok) {
      showToast('照片删除成功', 'success')
      await fetchActivities()
      // 刷新详情弹窗数据
      if (detailActivity.value && detailActivity.value.id === activityId) {
        const updated = activities.value.find(a => a.id === activityId)
        if (updated) detailActivity.value = updated
      }
    } else {
      showToast('照片删除失败', 'error')
    }
  } catch (e) {
    showToast('照片删除失败', 'error')
  }
}

// 处理照片选择
const onPhotoSelect = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return
  if (isEditing.value && editingId.value) {
    // 编辑模式：立即上传
    const form = new FormData()
    files.forEach(f => form.append('photos', f))
    fetch(`${API_BASE}/api/activities/${editingId.value}/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: form
    }).then(async res => {
      if (res.ok) {
        showToast('照片上传成功', 'success')
        await fetchActivities()
      } else {
        showToast('照片上传失败', 'error')
      }
    }).catch(() => showToast('照片上传失败', 'error'))
  } else {
    // 新增模式：暂存
    files.forEach(file => {
      pendingPhotos.value.push({
        file,
        preview: URL.createObjectURL(file)
      })
    })
  }
  e.target.value = ''
}

// 移除暂存照片
const removePendingPhoto = (index) => {
  URL.revokeObjectURL(pendingPhotos.value[index].preview)
  pendingPhotos.value.splice(index, 1)
}

// 触发文件选择
const triggerPhotoSelect = () => {
  photoInputRef.value?.click()
}

// 全屏预览
const openPhotoPreview = (url) => {
  previewPhotoUrl.value = url
  showPhotoPreview.value = true
}

const closePhotoPreview = () => {
  showPhotoPreview.value = false
  previewPhotoUrl.value = ''
}

// 描述摘要（2行截断）
const descSummary = (text) => {
  if (!text) return ''
  return text
}

// 照片数量文本
const photoCountText = (activity) => {
  const count = activity.photos?.length || 0
  return count > 0 ? `${count}张照片` : '暂无照片'
}

onMounted(() => { fetchActivities() })
</script>

<template>
  <div class="activity-view">
    <!-- 顶部操作栏 -->
    <div class="header-bar glass-card">
      <h2 class="page-title">活动管理</h2>
      <button class="btn-add" @click="openAddModal">+ 新增活动</button>
    </div>

    <!-- 活动列表 -->
    <div v-if="activities.length === 0" class="empty-state">
      <div class="empty-icon">📸</div>
      <p>暂无活动，点击新增</p>
    </div>

    <div v-else class="activity-grid">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-card"
      >
        <!-- 封面区域 -->
        <div class="card-cover" @click="openDetailModal(activity)">
          <img
            v-if="activity.photos && activity.photos.length > 0"
            :src="photoUrl(activity.photos[0])"
            alt="活动封面"
          />
          <div v-else class="cover-placeholder">
            <span class="placeholder-icon">📸</span>
            <span class="placeholder-text">暂无照片</span>
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="card-info">
          <h3 class="activity-title">{{ activity.title }}</h3>
          <p class="activity-meta">
            <span class="meta-icon">📅</span>
            {{ activity.date }} {{ activity.time }}
          </p>
          <p class="activity-meta">
            <span class="meta-icon">📍</span>
            {{ activity.location }}
          </p>
          <p class="activity-desc">{{ activity.description }}</p>
          <span class="photo-badge">{{ photoCountText(activity) }}</span>
        </div>

        <!-- 底部操作 -->
        <div class="card-actions">
          <button class="action-btn view-btn" @click="openDetailModal(activity)">查看详情</button>
          <button class="action-btn edit-btn" @click="openEditModal(activity)">编辑</button>
          <button class="action-btn delete-btn" @click="confirmDelete(activity.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div class="modal-overlay" :class="{ active: showFormModal }" @click="closeFormModal">
      <div class="modal-content form-modal-content" v-if="showFormModal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '编辑活动' : '新增活动' }}</h3>
          <button class="modal-close" @click="closeFormModal">×</button>
        </div>
        <div class="modal-body form-body">
          <div class="form-group form-group-full">
            <label>活动标题 <span class="required">*</span></label>
            <input v-model="formData.title" type="text" placeholder="请输入活动标题" :class="{ error: formErrors.title }" />
            <span v-if="formErrors.title" class="error-text">{{ formErrors.title }}</span>
          </div>
          <div class="form-group">
            <label>日期 <span class="required">*</span></label>
            <input v-model="formData.date" type="date" :class="{ error: formErrors.date }" />
            <span v-if="formErrors.date" class="error-text">{{ formErrors.date }}</span>
          </div>
          <div class="form-group">
            <label>时间 <span class="required">*</span></label>
            <input v-model="formData.time" type="time" :class="{ error: formErrors.time }" />
            <span v-if="formErrors.time" class="error-text">{{ formErrors.time }}</span>
          </div>
          <div class="form-group form-group-full">
            <label>地点 <span class="required">*</span></label>
            <input v-model="formData.location" type="text" placeholder="请输入活动地点" :class="{ error: formErrors.location }" />
            <span v-if="formErrors.location" class="error-text">{{ formErrors.location }}</span>
          </div>
          <div class="form-group form-group-full">
            <label>活动描述 <span class="required">*</span></label>
            <textarea
              v-model="formData.description"
              placeholder="请输入活动描述"
              rows="4"
              :class="{ error: formErrors.description }"
            ></textarea>
            <span v-if="formErrors.description" class="error-text">{{ formErrors.description }}</span>
          </div>

          <!-- 已上传照片（仅编辑模式） -->
          <div v-if="isEditing" class="form-group form-group-full">
            <label>已上传照片</label>
            <div v-if="editingId && activities.find(a => a.id === editingId)?.photos?.length" class="photo-grid">
              <div
                v-for="filename in activities.find(a => a.id === editingId).photos"
                :key="filename"
                class="photo-thumb-wrap"
              >
                <img :src="photoUrl(filename)" class="photo-thumb" />
                <button class="photo-delete" @click="deletePhoto(editingId, filename)">×</button>
              </div>
            </div>
            <div v-else class="photo-empty">暂无照片</div>
          </div>

          <!-- 上传新照片 -->
          <div class="form-group form-group-full">
            <label>上传新照片</label>
            <div class="upload-zone" @click="triggerPhotoSelect">
              <span class="upload-icon">📤</span>
              <span class="upload-text">点击上传照片（支持多选）</span>
            </div>
            <input
              ref="photoInputRef"
              type="file"
              multiple
              accept="image/*"
              style="display: none"
              @change="onPhotoSelect"
            />
            <!-- 新增模式暂存预览 -->
            <div v-if="pendingPhotos.length > 0" class="pending-photo-grid">
              <div
                v-for="(p, idx) in pendingPhotos"
                :key="idx"
                class="photo-thumb-wrap"
              >
                <img :src="p.preview" class="photo-thumb" />
                <button class="photo-delete" @click="removePendingPhoto(idx)">×</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeFormModal">取消</button>
          <button class="btn-save" @click="submitForm">保存</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" :class="{ active: showDetailModal }" @click="closeDetailModal">
      <div class="modal-content detail-modal-content" v-if="showDetailModal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ detailActivity?.title }}</h3>
          <button class="modal-close" @click="closeDetailModal">×</button>
        </div>
        <div class="modal-body detail-body">
          <div class="detail-meta">
            <p><span class="detail-icon">📅</span> {{ detailActivity?.date }} {{ detailActivity?.time }}</p>
            <p><span class="detail-icon">📍</span> {{ detailActivity?.location }}</p>
          </div>
          <div class="detail-desc">
            <p>{{ detailActivity?.description }}</p>
          </div>
          <div v-if="detailActivity?.photos?.length" class="detail-photos">
            <label>活动照片</label>
            <div class="detail-photo-grid">
              <img
                v-for="filename in detailActivity.photos"
                :key="filename"
                :src="photoUrl(filename)"
                class="detail-photo-thumb"
                @click="openPhotoPreview(photoUrl(filename))"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" :class="{ active: showDeleteConfirm }" @click="showDeleteConfirm = false">
      <div class="modal-content confirm-modal-content" v-if="showDeleteConfirm" @click.stop>
        <div class="confirm-body">
          <div class="confirm-icon">⚠️</div>
          <h3>确认删除</h3>
          <p>确定要删除该活动吗？关联的所有照片将一并删除。</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="executeDelete">确认删除</button>
        </div>
      </div>
    </div>

    <!-- 全屏照片预览 -->
    <div class="photo-preview-overlay" :class="{ active: showPhotoPreview }" @click="closePhotoPreview">
      <img v-if="previewPhotoUrl" :src="previewPhotoUrl" class="preview-image" @click.stop />
    </div>

    <!-- Toast -->
    <div class="toast" :class="[toast.type, { show: toast.show }]">{{ toast.message }}</div>
  </div>
</template>

<style scoped>
.activity-view {
  width: 100%;
}

/* 顶部栏 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-bar .page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-add {
  padding: 10px 22px;
  background: linear-gradient(135deg, var(--primary), #4a7a5c);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-add:hover {
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3);
  transform: translateY(-2px);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  border: 1.5px dashed rgba(91, 140, 110, 0.2);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 15px;
  color: var(--text-secondary);
}

/* 活动网格 */
.activity-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* 活动卡片 */
.activity-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 封面 */
.card-cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
  cursor: pointer;
  background: #f0f0f0;
  position: relative;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.card-cover:hover img {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 8px;
}

.placeholder-icon {
  font-size: 36px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  opacity: 0.6;
}

/* 信息区域 */
.card-info {
  padding: 16px 18px 10px;
  flex: 1;
}

.activity-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.activity-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 14px;
}

.activity-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.photo-badge {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(91, 140, 110, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: var(--primary);
  font-weight: 500;
}

/* 卡片操作 */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.action-btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(91, 140, 110, 0.2);
  background: rgba(91, 140, 110, 0.06);
  color: var(--text-primary);
}

.action-btn:hover {
  transform: translateY(-1px);
}

.view-btn:hover {
  background: rgba(91, 140, 110, 0.12);
  border-color: var(--secondary);
}

.edit-btn:hover {
  background: rgba(91, 140, 110, 0.12);
  border-color: var(--secondary);
}

.delete-btn:hover {
  background: rgba(224, 96, 96, 0.12);
  border-color: var(--danger);
  color: var(--danger);
}

/* 弹窗公共样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay.active {
  display: flex;
}

.modal-content {
  background: #ffffff;
  border-radius: 15px;
  padding: 30px;
  width: 90%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(91, 140, 110, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 28px;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
  transition: color 0.3s;
}

.modal-close:hover {
  color: var(--text-primary);
}

/* 表单弹窗 */
.form-modal-content {
  max-width: 560px;
  max-height: 88vh;
  overflow-y: auto;
}

.form-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 10px 12px;
  background: #f8f9f5;
  border: 1px solid rgba(91, 140, 110, 0.2);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 8px rgba(91, 140, 110, 0.15);
}

.form-group input.error,
.form-group textarea.error {
  border-color: var(--danger);
}

.form-group textarea {
  resize: vertical;
  min-height: 90px;
}

.required {
  color: var(--danger);
}

.error-text {
  font-size: 12px;
  color: var(--danger);
}

/* 照片网格 */
.photo-grid,
.pending-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-empty {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 12px;
  background: #f8f9f5;
  border-radius: 8px;
  text-align: center;
}

.photo-thumb-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--danger);
  color: #fff;
  border: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.photo-delete:hover {
  opacity: 1;
}

/* 上传区域 */
.upload-zone {
  border: 2px dashed rgba(91, 140, 110, 0.3);
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8f9f5;
}

.upload-zone:hover {
  border-color: var(--primary);
  background: rgba(91, 140, 110, 0.04);
}

.upload-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 详情弹窗 */
.detail-modal-content {
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-meta p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  font-size: 16px;
}

.detail-desc {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.7;
  padding: 12px;
  background: #f8f9f5;
  border-radius: 10px;
}

.detail-photos label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  display: block;
  margin-bottom: 10px;
}

.detail-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.detail-photo-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.detail-photo-thumb:hover {
  transform: scale(1.05);
}

/* 全屏预览 */
.photo-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  cursor: pointer;
}

.photo-preview-overlay.active {
  display: flex;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-glow);
}

.btn-cancel {
  padding: 10px 24px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-secondary);
  border: 1px solid rgba(91, 140, 110, 0.2);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-save {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--primary), #4a7a5c);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save:hover {
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3);
  transform: translateY(-2px);
}

/* 删除确认 */
.confirm-modal-content {
  max-width: 400px;
  text-align: center;
}

.confirm-body {
  padding: 20px 0;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.confirm-body h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.confirm-body p {
  font-size: 14px;
  color: var(--text-secondary);
}

.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-glow);
}

.btn-delete {
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--danger), #c05050);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  box-shadow: 0 4px 16px rgba(224, 96, 96, 0.3);
  transform: translateY(-2px);
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

/* glass-card */
.glass-card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-glow);
}

/* 响应式 */
@media (max-width: 900px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .header-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-add {
    width: 100%;
  }

  .form-body {
    grid-template-columns: 1fr;
  }

  .form-group-full {
    grid-column: auto;
  }

  .photo-grid,
  .pending-photo-grid,
  .detail-photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
