<script setup>
import { ref, computed, onMounted } from 'vue'

const users = ref([])
const searchKeyword = ref('')
const selectedSex = ref('')
const selectedEducation = ref('')
const selectedMaritalStatus = ref('')
const selectedActionCapability = ref('')

const showModal = ref(false)
const selectedVuln = ref(null)

const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const defaultForm = () => ({
  name: '', sex: '', age: '', nativePlace: '', domicileAddress: '', citizenship: '',
  nationality: '', politicsStatus: '', maritalStatus: '', certificateType: '',
  certificateNumber: '', education: '', originalUnits: '', originalOccupation: '',
  residentialAddress: '', telephoneNumber: '', emergencyContact: '',
  medicareDesignatedHospital: '', socialSecurityCardNumber: '', pocketbook: '',
  reasonCheckin: '', actionCapability: '', bunk: '', remainingSum: '',
  healthInformation: { MBG: '', MAP: '', MBF: '' }
})
const formData = ref(defaultForm())
const formErrors = ref({})
const showDeleteConfirm = ref(false)
const deleteTargetId = ref(null)
const toast = ref({ show: false, message: '', type: 'success' })
const API_BASE = 'http://localhost:5000'

const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/users`)
    const data = await response.json()
    users.value = data
  } catch (error) {
    console.error('数据加载失败:', error)
    showToast('数据加载失败', 'error')
  }
}

const searchUsers = (keyword, filters = {}) => {
  let results = users.value
  if (keyword) {
    const kw = keyword.toLowerCase()
    results = results.filter(v =>
      v.id.toLowerCase().includes(kw) ||
      v.name.toLowerCase().includes(kw) ||
      v.sex.toLowerCase().includes(kw) ||
      v.nativePlace.toLowerCase().includes(kw) ||
      v.domicileAddress.toLowerCase().includes(kw) ||
      v.citizenship.toLowerCase().includes(kw) ||
      v.nationality.toLowerCase().includes(kw) ||
      v.politicsStatus.toLowerCase().includes(kw) ||
      v.maritalStatus.toLowerCase().includes(kw) ||
      v.certificateNumber.toLowerCase().includes(kw) ||
      v.education.toLowerCase().includes(kw) ||
      v.originalUnits.toLowerCase().includes(kw) ||
      v.originalOccupation.toLowerCase().includes(kw) ||
      v.residentialAddress.toLowerCase().includes(kw) ||
      v.telephoneNumber.toLowerCase().includes(kw) ||
      v.medicareDesignatedHospital.toLowerCase().includes(kw) ||
      v.socialSecurityCardNumber.toLowerCase().includes(kw) ||
      v.pocketbook.toLowerCase().includes(kw) ||
      v.reasonCheckin.toLowerCase().includes(kw) ||
      v.actionCapability.toLowerCase().includes(kw) ||
      v.bunk.toLowerCase().includes(kw)
    )
  }
  if (filters.sex) results = results.filter(v => v.sex === filters.sex)
  if (filters.education) results = results.filter(v => v.education === filters.education)
  if (filters.maritalStatus) results = results.filter(v => v.maritalStatus.includes(filters.maritalStatus))
  if (filters.actionCapability) results = results.filter(v => v.actionCapability === filters.actionCapability)
  return results
}

const filteredVulns = computed(() => searchUsers(searchKeyword.value, {
  sex: selectedSex.value,
  education: selectedEducation.value,
  maritalStatus: selectedMaritalStatus.value,
  actionCapability: selectedActionCapability.value
}))

const Sexes = [
  { label: '性别', value: '' },
  { label: '男性', value: '男' },
  { label: '女性', value: '女' }
]
const Educations = [
  { label: '文化程度', value: '' },
  { label: '小学学历', value: '小学' },
  { label: '初中学历', value: '初中' },
  { label: '高中学历', value: '高中' },
  { label: '本科学历', value: '本科' },
  { label: '硕士学历', value: '硕士' },
  { label: '博士学历', value: '博士' },
  { label: '中专学历', value: '中专' },
  { label: '大专学历', value: '大专' }
]
const MaritalStatuses = [
  { label: '婚姻情况', value: '' },
  { label: '未婚', value: '未婚' },
  { label: '已婚', value: '已婚' },
  { label: '离异', value: '离异' },
  { label: '丧偶', value: '丧偶' }
]
const ActionCapabilities = [
  { label: '行动能力', value: '' },
  { label: '完全失能', value: '完全失能' },
  { label: '中度失能', value: '中度失能' },
  { label: '轻度失能', value: '轻度失能' },
  { label: '能力完好', value: '能力完好' }
]

const resetForm = () => { formData.value = defaultForm(); formErrors.value = {} }
const openAddModal = () => { isEditing.value = false; editingId.value = null; resetForm(); photoPreview.value = null; selectedPhoto.value = null; showFormModal.value = true }
const openEditModal = (user) => {
  isEditing.value = true
  editingId.value = user.id
  formData.value = JSON.parse(JSON.stringify(user))
  if (!formData.value.healthInformation) formData.value.healthInformation = { MBG: '', MAP: '', MBF: '' }
  photoPreview.value = null
  selectedPhoto.value = null
  showFormModal.value = true
}
const closeFormModal = () => { showFormModal.value = false; resetForm(); photoPreview.value = null; selectedPhoto.value = null }

const validateForm = () => {
  const errors = {}
  if (!formData.value.name?.trim()) errors.name = '姓名不能为空'
  if (!formData.value.sex) errors.sex = '性别不能为空'
  const ageVal = formData.value.age
  if (ageVal === '' || ageVal === null || ageVal === undefined) {
    errors.age = '年龄不能为空'
  } else {
    const ageNum = Number(ageVal)
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) errors.age = '年龄范围不合理'
  }
  if (!formData.value.telephoneNumber?.trim()) {
    errors.telephoneNumber = '电话不能为空'
  } else if (!/^\d{11}$/.test(formData.value.telephoneNumber)) {
    errors.telephoneNumber = '电话必须为11位数字'
  }
  if (!formData.value.actionCapability) errors.actionCapability = '行动能力不能为空'
  if (!formData.value.bunk?.trim()) errors.bunk = '床位不能为空'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const buildPayload = () => {
  const d = formData.value
  return {
    ...d,
    age: d.age !== '' && d.age !== null ? Number(d.age) : null,
    remainingSum: d.remainingSum !== '' && d.remainingSum !== null ? Number(d.remainingSum) : null,
    healthInformation: {
      MBG: d.healthInformation?.MBG !== '' && d.healthInformation?.MBG !== null ? Number(d.healthInformation.MBG) : null,
      MAP: d.healthInformation?.MAP !== '' && d.healthInformation?.MAP !== null ? Number(d.healthInformation.MAP) : null,
      MBF: d.healthInformation?.MBF !== '' && d.healthInformation?.MBF !== null ? Number(d.healthInformation.MBF) : null
    }
  }
}

const submitForm = async () => {
  if (!validateForm()) return
  const payload = buildPayload()
  try {
    const url = isEditing.value ? `${API_BASE}/api/users/${editingId.value}` : `${API_BASE}/api/users`
    const response = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('user_token')}`
      },
      body: JSON.stringify(payload)
    })
    if (response.ok) {
      const responseData = await response.json().catch(() => ({}))
      if (selectedPhoto.value) {
        const photoFormData = new FormData()
        photoFormData.append('photo', selectedPhoto.value)
        const userId = isEditing.value ? editingId.value : (responseData.data?.id || responseData.id)
        if (userId) {
          await fetch(`${API_BASE}/api/users/${userId}/photo`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
            body: photoFormData
          })
        }
      }
      showToast(isEditing.value ? '编辑成功' : '新增成功', 'success')
      closeFormModal()
      fetchUsers()
    } else {
      const err = await response.json().catch(() => ({}))
      showToast(err.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('提交失败:', error)
    showToast('网络错误，请稍后重试', 'error')
  }
}

const confirmDelete = (id) => { deleteTargetId.value = id; showDeleteConfirm.value = true }
const executeDelete = async () => {
  if (!deleteTargetId.value) return
  try {
    const response = await fetch(`${API_BASE}/api/users/${deleteTargetId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('user_token')}`
      }
    })
    if (response.ok) {
      showToast('删除成功', 'success')
      fetchUsers()
    } else {
      showToast('删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败', 'error')
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

const photoInput = ref(null)
const photoPreview = ref(null)
const selectedPhoto = ref(null)

const triggerPhotoInput = () => {
  photoInput.value.click()
}

const handlePhotoSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showToast('只支持 JPG、PNG、WebP 格式', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('照片大小不能超过 5MB', 'error')
    return
  }
  selectedPhoto.value = file
  const reader = new FileReader()
  reader.onload = (e) => { photoPreview.value = e.target.result }
  reader.readAsDataURL(file)
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const openDetail = (vuln) => { selectedVuln.value = vuln; showModal.value = true }
const closeModal = () => { showModal.value = false; selectedVuln.value = null }

onMounted(() => { fetchUsers() })
</script>

<template>
  <div class="poc-view">
    <!-- 搜索和筛选区域 -->
    <div class="filter-section glass-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="searchKeyword" type="text" placeholder="搜索名称、描述..." class="search-input" />
      </div>
      <div class="filter-group">
        <select v-model="selectedSex" class="filter-select"><option v-for="item in Sexes" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        <select v-model="selectedEducation" class="filter-select"><option v-for="item in Educations" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        <select v-model="selectedMaritalStatus" class="filter-select"><option v-for="item in MaritalStatuses" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        <select v-model="selectedActionCapability" class="filter-select"><option v-for="item in ActionCapabilities" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </div>
      <button class="btn-add" @click="openAddModal">➕ 新增老人</button>
      <div class="result-count">找到 <span class="count">{{ filteredVulns.length }}</span> 个老人</div>
    </div>

    <!-- 卡片列表 -->
    <div class="poc-grid">
      <div v-for="vuln in filteredVulns" :key="vuln.id" class="vuln-card glass-card" :class="vuln.actionCapability">
        <div class="vuln-header">
          <h3 class="vuln-name">{{ vuln.name }}</h3>
          <div class="header-actions">
            <span class="risk-badge" :class="vuln.actionCapability">{{ vuln.actionCapability }}</span>
            <button class="icon-btn edit-btn" @click.stop="openEditModal(vuln)" title="编辑">✏️</button>
            <button class="icon-btn delete-btn" @click.stop="confirmDelete(vuln.id)" title="删除">🗑️</button>
          </div>
        </div>
        <div class="vuln-meta">
          <span class="meta-item"><span class="meta-icon">🎯</span>{{ vuln.id }}</span>
          <span class="meta-item"><span class="meta-icon">💻</span>{{ vuln.bunk }}</span>
          <span class="meta-item"><span class="meta-icon">📞</span>{{ vuln.telephoneNumber }}</span>
        </div>
        <p class="vuln-desc">{{ vuln.reasonCheckin }}</p>
        <div class="vuln-tags">
          <span class="tag">社保号：{{ vuln.socialSecurityCardNumber }}</span>
          <span class="tag">紧急联系电话：{{ vuln.emergencyContact }}</span>
        </div>
        <div class="vuln-stats">
          <div class="stat"><span class="stat-label">行动能力</span><span class="stat-value">{{ vuln.actionCapability }}</span></div>
          <div class="stat"><span class="stat-label">年龄</span><span class="stat-value">{{ vuln.age }}</span></div>
          <div class="stat"><span class="stat-label">平均血糖</span><span class="stat-value">{{ vuln.healthInformation?.MBG }}</span></div>
          <div class="stat"><span class="stat-label">平均血压</span><span class="stat-value">{{ vuln.healthInformation?.MAP }}</span></div>
          <div class="stat"><span class="stat-label">平均血脂</span><span class="stat-value">{{ vuln.healthInformation?.MBF }}</span></div>
          <div class="stat"><span class="stat-label">余额</span><span class="stat-value">{{ vuln.remainingSum }}</span></div>
        </div>
        <div class="vuln-actions">
          <button class="btn-detail" @click="openDetail(vuln)">📖 查看详情</button>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="filteredVulns.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>未找到匹配的老人</h3>
      <p>请尝试调整筛选条件</p>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" :class="{active: showModal}" @click="closeModal">
      <div class="modal-content" v-if="selectedVuln" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h3 class="modal-title">{{ selectedVuln.name }}</h3>
            <span class="risk-badge" :class="selectedVuln.actionCapability">{{ selectedVuln.actionCapability }}</span>
          </div>
          <div class="detail-header-right">
            <div class="avatar-display">
              <img v-if="selectedVuln.photo"
                   :src="`${API_BASE}/api/uploads/users/${selectedVuln.photo}`"
                   :alt="selectedVuln.name"
                   class="avatar-img" />
              <div v-else class="avatar-placeholder">{{ selectedVuln.name ? selectedVuln.name.charAt(0) : '?' }}</div>
            </div>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
        </div>
        <div class="modal-body">
          <!-- 基本信息 -->
          <div class="vuln-section">
            <h4>📌 基本信息</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">姓名</span><span class="info-value">{{ selectedVuln.name }}</span></div>
              <div class="info-item"><span class="info-label">性别</span><span class="info-value">{{ selectedVuln.sex }}</span></div>
              <div class="info-item"><span class="info-label">年龄</span><span class="info-value">{{ selectedVuln.age }}</span></div>
              <div class="info-item"><span class="info-label">籍贯</span><span class="info-value">{{ selectedVuln.nativePlace }}</span></div>
              <div class="info-item"><span class="info-label">国籍</span><span class="info-value">{{ selectedVuln.citizenship }}</span></div>
              <div class="info-item"><span class="info-label">民族</span><span class="info-value">{{ selectedVuln.nationality }}</span></div>
              <div class="info-item"><span class="info-label">政治面貌</span><span class="info-value">{{ selectedVuln.politicsStatus }}</span></div>
              <div class="info-item"><span class="info-label">婚姻状况</span><span class="info-value">{{ selectedVuln.maritalStatus }}</span></div>
              <div class="info-item"><span class="info-label">文化程度</span><span class="info-value">{{ selectedVuln.education }}</span></div>
            </div>
          </div>
          <!-- 证件信息 -->
          <div class="vuln-section">
            <h4>🪪 证件信息</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">证件类型</span><span class="info-value">{{ selectedVuln.certificateType }}</span></div>
              <div class="info-item"><span class="info-label">证件号码</span><span class="info-value">{{ selectedVuln.certificateNumber }}</span></div>
              <div class="info-item"><span class="info-label">社保卡号</span><span class="info-value">{{ selectedVuln.socialSecurityCardNumber }}</span></div>
            </div>
          </div>
          <!-- 联系方式 -->
          <div class="vuln-section">
            <h4>📞 联系方式</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">电话</span><span class="info-value">{{ selectedVuln.telephoneNumber }}</span></div>
              <div class="info-item"><span class="info-label">紧急联系电话</span><span class="info-value">{{ selectedVuln.emergencyContact }}</span></div>
              <div class="info-item"><span class="info-label">现住址</span><span class="info-value">{{ selectedVuln.residentialAddress }}</span></div>
              <div class="info-item"><span class="info-label">原住址</span><span class="info-value">{{ selectedVuln.domicileAddress }}</span></div>
            </div>
          </div>
          <!-- 入院信息 -->
          <div class="vuln-section">
            <h4>🏥 入院信息</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">床位</span><span class="info-value">{{ selectedVuln.bunk }}</span></div>
              <div class="info-item"><span class="info-label">行动能力</span><span class="info-value">{{ selectedVuln.actionCapability }}</span></div>
              <div class="info-item"><span class="info-label">入院原因</span><span class="info-value">{{ selectedVuln.reasonCheckin }}</span></div>
              <div class="info-item"><span class="info-label">经济来源</span><span class="info-value">{{ selectedVuln.pocketbook }}</span></div>
              <div class="info-item"><span class="info-label">账户余额</span><span class="info-value">¥{{ selectedVuln.remainingSum }}</span></div>
              <div class="info-item"><span class="info-label">医保定点医院</span><span class="info-value">{{ selectedVuln.medicareDesignatedHospital }}</span></div>
            </div>
          </div>
          <!-- 健康指标 -->
          <div class="vuln-section">
            <h4>❤️ 健康指标</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">平均血糖 MBG</span><span class="info-value">{{ selectedVuln.healthInformation?.MBG }}</span></div>
              <div class="info-item"><span class="info-label">平均血压 MAP</span><span class="info-value">{{ selectedVuln.healthInformation?.MAP }}</span></div>
              <div class="info-item"><span class="info-label">平均血脂 MBF</span><span class="info-value">{{ selectedVuln.healthInformation?.MBF }}</span></div>
            </div>
          </div>
          <!-- 工作信息 -->
          <div class="vuln-section">
            <h4>💼 工作信息</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">原单位</span><span class="info-value">{{ selectedVuln.originalUnits }}</span></div>
              <div class="info-item"><span class="info-label">原职业</span><span class="info-value">{{ selectedVuln.originalOccupation }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单弹窗 -->
    <div class="modal-overlay" :class="{active: showFormModal}" @click="closeFormModal">
      <div class="modal-content form-modal-content" v-if="showFormModal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '编辑老人信息' : '新增老人信息' }}</h3>
          <button class="modal-close" @click="closeFormModal">×</button>
        </div>
        <div class="modal-body form-body">
          <div class="photo-upload-section">
            <h4>📷 照片</h4>
            <div class="photo-upload-area" @click="triggerPhotoInput">
              <img v-if="photoPreview" :src="photoPreview" class="photo-preview" />
              <img v-else-if="formData.photo"
                   :src="`${API_BASE}/api/uploads/users/${formData.photo}`"
                   class="photo-preview" />
              <div v-else class="photo-placeholder">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击上传照片</span>
              </div>
            </div>
            <input type="file" ref="photoInput" accept="image/jpeg,image/png,image/webp"
                   @change="handlePhotoSelect" style="display:none" />
          </div>
          <div class="form-section">
            <h4>📌 基本信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>姓名 <span class="required">*</span></label><input v-model="formData.name" placeholder="请输入姓名" :class="{error: formErrors.name}" /><span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span></div>
              <div class="form-group"><label>性别 <span class="required">*</span></label><select v-model="formData.sex" :class="{error: formErrors.sex}"><option value="">请选择</option><option value="男">男</option><option value="女">女</option></select><span v-if="formErrors.sex" class="error-text">{{ formErrors.sex }}</span></div>
              <div class="form-group"><label>年龄 <span class="required">*</span></label><input v-model="formData.age" type="number" placeholder="请输入年龄" :class="{error: formErrors.age}" /><span v-if="formErrors.age" class="error-text">{{ formErrors.age }}</span></div>
              <div class="form-group"><label>籍贯</label><input v-model="formData.nativePlace" placeholder="请输入籍贯" /></div>
              <div class="form-group"><label>国籍</label><input v-model="formData.citizenship" placeholder="请输入国籍" /></div>
              <div class="form-group"><label>民族</label><input v-model="formData.nationality" placeholder="请输入民族" /></div>
              <div class="form-group"><label>政治面貌</label><input v-model="formData.politicsStatus" placeholder="请输入政治面貌" /></div>
              <div class="form-group"><label>婚姻状况</label><select v-model="formData.maritalStatus"><option value="">请选择</option><option v-for="item in MaritalStatuses.slice(1)" :key="item.value" :value="item.value">{{ item.label }}</option></select></div>
              <div class="form-group"><label>文化程度</label><select v-model="formData.education"><option value="">请选择</option><option v-for="item in Educations.slice(1)" :key="item.value" :value="item.value">{{ item.label }}</option></select></div>
            </div>
          </div>
          <div class="form-section">
            <h4>🪪 证件信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>证件类型</label><input v-model="formData.certificateType" placeholder="请输入证件类型" /></div>
              <div class="form-group"><label>证件号码</label><input v-model="formData.certificateNumber" placeholder="请输入证件号码" /></div>
            </div>
          </div>
          <div class="form-section">
            <h4>📞 联系信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>电话 <span class="required">*</span></label><input v-model="formData.telephoneNumber" placeholder="请输入11位电话号码" :class="{error: formErrors.telephoneNumber}" /><span v-if="formErrors.telephoneNumber" class="error-text">{{ formErrors.telephoneNumber }}</span></div>
              <div class="form-group"><label>紧急联系电话</label><input v-model="formData.emergencyContact" placeholder="请输入紧急联系电话" /></div>
              <div class="form-group"><label>现住址</label><input v-model="formData.residentialAddress" placeholder="请输入现住址" /></div>
              <div class="form-group"><label>原住址</label><input v-model="formData.domicileAddress" placeholder="请输入原住址" /></div>
            </div>
          </div>
          <div class="form-section">
            <h4>🏥 入院信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>床位 <span class="required">*</span></label><input v-model="formData.bunk" placeholder="请输入床位" :class="{error: formErrors.bunk}" /><span v-if="formErrors.bunk" class="error-text">{{ formErrors.bunk }}</span></div>
              <div class="form-group"><label>行动能力 <span class="required">*</span></label><select v-model="formData.actionCapability" :class="{error: formErrors.actionCapability}"><option value="">请选择</option><option v-for="item in ActionCapabilities.slice(1)" :key="item.value" :value="item.value">{{ item.label }}</option></select><span v-if="formErrors.actionCapability" class="error-text">{{ formErrors.actionCapability }}</span></div>
              <div class="form-group"><label>入院原因</label><input v-model="formData.reasonCheckin" placeholder="请输入入院原因" /></div>
              <div class="form-group"><label>经济来源</label><input v-model="formData.pocketbook" placeholder="请输入经济来源" /></div>
              <div class="form-group"><label>账户余额</label><input v-model="formData.remainingSum" type="number" placeholder="请输入账户余额" /></div>
            </div>
          </div>
          <div class="form-section">
            <h4>❤️ 健康信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>平均血糖 (MBG)</label><input v-model="formData.healthInformation.MBG" type="number" step="0.1" placeholder="请输入平均血糖" /></div>
              <div class="form-group"><label>平均血压 (MAP)</label><input v-model="formData.healthInformation.MAP" type="number" step="0.1" placeholder="请输入平均血压" /></div>
              <div class="form-group"><label>平均血脂 (MBF)</label><input v-model="formData.healthInformation.MBF" type="number" step="0.1" placeholder="请输入平均血脂" /></div>
            </div>
          </div>
          <div class="form-section">
            <h4>💊 医疗信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>医保定点医院</label><input v-model="formData.medicareDesignatedHospital" placeholder="请输入医保定点医院" /></div>
              <div class="form-group"><label>社保卡号</label><input v-model="formData.socialSecurityCardNumber" placeholder="请输入社保卡号" /></div>
            </div>
          </div>
          <div class="form-section">
            <h4>💼 工作信息</h4>
            <div class="form-grid">
              <div class="form-group"><label>原单位</label><input v-model="formData.originalUnits" placeholder="请输入原单位" /></div>
              <div class="form-group"><label>原职业</label><input v-model="formData.originalOccupation" placeholder="请输入原职业" /></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeFormModal">取消</button>
          <button class="btn-save" @click="submitForm">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" :class="{active: showDeleteConfirm}" @click="showDeleteConfirm = false">
      <div class="modal-content confirm-modal-content" v-if="showDeleteConfirm" @click.stop>
        <div class="confirm-body">
          <div class="confirm-icon">⚠️</div>
          <h3>确认删除</h3>
          <p>确定要删除该老人信息吗？此操作不可撤销。</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="executeDelete">确认删除</button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div class="toast" :class="[toast.type, {show: toast.show}]">{{ toast.message }}</div>
  </div>
</template>

<style scoped>
.poc-view { width: 100%; }
.filter-section { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; padding: 20px; }
.search-box { flex: 1; min-width: 300px; display: flex; align-items: center; background: #ffffff; border: 1px solid var(--border-glow); border-radius: 10px; padding: 0 15px; }
.search-icon { font-size: 16px; margin-right: 10px; }
.search-input { flex: 1; background: transparent; border: none; padding: 12px 0; }
.filter-group { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-select { min-width: 150px; padding: 10px 15px; background: #ffffff; border: 1px solid var(--border-glow); border-radius: 8px; color: var(--text-primary); cursor: pointer; }
.result-count { font-size: 14px; color: var(--text-secondary); }
.result-count .count { color: var(--secondary); font-weight: 600; }
.poc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.vuln-card { transition: all 0.3s; position: relative; }
.vuln-card:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(91, 140, 110, 0.12); }
.vuln-card.high { border-left: 3px solid var(--danger); }
.vuln-card.medium { border-left: 3px solid var(--warning); }
.vuln-card.low { border-left: 3px solid var(--success); }
.vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.vuln-name { font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: var(--text-primary); }
.risk-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.risk-badge.high { background: rgba(224, 96, 96, 0.12); color: var(--danger); }
.risk-badge.medium { background: rgba(232, 168, 124, 0.12); color: var(--warning); }
.risk-badge.low { background: rgba(91, 140, 110, 0.12); color: var(--success); }
.vuln-meta { display: flex; gap: 15px; margin-bottom: 12px; flex-wrap: wrap; }
.meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-primary); }
.meta-icon { font-size: 14px; }
.vuln-desc { font-size: 13px; color: var(--text-primary); line-height: 1.6; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.vuln-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; }
.tag { padding: 4px 10px; background: rgba(91, 140, 110, 0.1); border-radius: 15px; font-size: 11px; color: var(--text-primary); }
.vuln-stats { display: flex; gap: 20px; padding: 12px 0; border-top: 1px solid rgba(0, 0, 0, 0.06); border-bottom: 1px solid rgba(0, 0, 0, 0.06); margin-bottom: 15px; }
.stat { display: flex; flex-direction: column; }
.stat-label { font-size: 12px; color: var(--text-primary); }
.stat-value { font-size: 14px; font-weight: 600; color: var(--secondary); }
.vuln-actions { display: flex; gap: 10px; }
.btn-detail, .btn-download { flex: 1; padding: 10px 15px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s; border: none; }
.btn-detail { background: rgba(91, 140, 110, 0.08); color: var(--primary); border: 1px solid rgba(91, 140, 110, 0.2); }
.btn-detail:hover { background: rgba(91, 140, 110, 0.15); }
.btn-download { background: linear-gradient(135deg, var(--primary), #4a7a5c); color: #fff; }
.btn-download:hover { box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3); }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 60px; margin-bottom: 20px; }
.empty-state h3 { font-size: 20px; color: var(--text-primary); margin-bottom: 10px; }
.empty-state p { color: var(--text-secondary); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; width: 100%; }
.detail-header-right { display: flex; align-items: center; gap: 12px; }
.avatar-display { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid var(--secondary); flex-shrink: 0; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; }
.photo-upload-section { margin-bottom: 20px; }
.photo-upload-section h4 { font-family: var(--font-heading); font-size: 14px; color: var(--primary); margin-bottom: 12px; border-bottom: 1px solid rgba(91, 140, 110, 0.15); padding-bottom: 8px; }
.photo-upload-area { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 2px dashed var(--border-glow); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 10px auto; transition: border-color 0.3s; }
.photo-upload-area:hover { border-color: var(--primary); }
.photo-preview { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { text-align: center; color: var(--text-secondary); }
.upload-icon { font-size: 28px; display: block; }
.upload-text { font-size: 12px; }
.modal-title-wrap { display: flex; align-items: center; gap: 15px; }
.modal-close { background: none; border: none; color: var(--text-secondary); font-size: 28px; cursor: pointer; padding: 0 5px; line-height: 1; transition: color 0.3s; }
.modal-close:hover { color: var(--text-primary); }
.modal-content { background: #ffffff; border-radius: 15px; padding: 30px; min-width: 500px; max-width: 800px; width: 90%; position: relative; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); border: 1px solid rgba(91, 140, 110, 0.15); }
.vuln-section { margin-bottom: 25px; }
.vuln-section h4 { font-family: var(--font-heading); font-size: 14px; color: var(--primary); margin-bottom: 12px; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.info-grid-auto { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.info-item { display: flex; flex-direction: column; }
.info-label { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
.info-value { font-size: 14px; color: var(--text-primary); }
.platform-list, .cpu-list { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.platform-item { padding: 6px 14px; background: rgba(91, 140, 110, 0.1); border-radius: 20px; font-size: 12px; color: var(--success); }
.cpu-item { padding: 6px 14px; background: rgba(91, 140, 110, 0.1); border-radius: 20px; font-size: 12px; color: var(--primary); }
.modal-actions { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-glow); }

/* 新增样式 */
.btn-add { padding: 10px 20px; background: linear-gradient(135deg, var(--primary), #4a7a5c); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.btn-add:hover { box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3); transform: translateY(-2px); }
.header-actions { display: flex; align-items: center; gap: 6px; }
.icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(91, 140, 110, 0.2); background: rgba(91, 140, 110, 0.06); color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.3s; padding: 0; }
.icon-btn:hover { transform: scale(1.1); }
.edit-btn:hover { background: rgba(91, 140, 110, 0.15); border-color: var(--secondary); }
.delete-btn:hover { background: rgba(224, 96, 96, 0.15); border-color: var(--danger); }
.form-modal-content { max-width: 900px; width: 90%; max-height: 85vh; overflow-y: auto; background: #ffffff; border: 1px solid rgba(91, 140, 110, 0.15); }
.form-body { padding-right: 10px; }
.form-section { margin-bottom: 20px; }
.form-section h4 { font-family: var(--font-heading); font-size: 14px; color: var(--primary); margin-bottom: 12px; border-bottom: 1px solid rgba(91, 140, 110, 0.15); padding-bottom: 8px; }
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-group input, .form-group select { padding: 10px 12px; background: #f8f9f5; border: 1px solid rgba(91, 140, 110, 0.2); border-radius: 8px; color: var(--text-primary); font-size: 14px; outline: none; transition: all 0.3s; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); box-shadow: 0 0 8px rgba(91, 140, 110, 0.15); }
.form-group input.error, .form-group select.error { border-color: var(--danger); }
.required { color: var(--danger); }
.error-text { font-size: 12px; color: var(--danger); margin-top: 4px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-glow); }
.btn-cancel { padding: 10px 24px; background: rgba(0,0,0,0.04); color: var(--text-secondary); border: 1px solid rgba(91, 140, 110, 0.2); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-cancel:hover { background: rgba(0,0,0,0.08); }
.btn-save { padding: 10px 24px; background: linear-gradient(135deg, var(--primary), #4a7a5c); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-save:hover { box-shadow: 0 4px 16px rgba(91, 140, 110, 0.3); transform: translateY(-2px); }
.confirm-modal-content { max-width: 400px; text-align: center; }
.confirm-body { padding: 20px 0; }
.confirm-icon { font-size: 48px; margin-bottom: 15px; }
.confirm-body h3 { font-size: 20px; color: var(--text-primary); margin-bottom: 10px; }
.confirm-body p { font-size: 14px; color: var(--text-secondary); }
.confirm-footer { display: flex; justify-content: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-glow); }
.btn-delete { padding: 10px 24px; background: linear-gradient(135deg, var(--danger), #c05050); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-delete:hover { box-shadow: 0 4px 16px rgba(224, 96, 96, 0.3); transform: translateY(-2px); }
.toast { position: fixed; top: 20px; right: 20px; padding: 14px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; color: #fff; z-index: 2000; opacity: 0; transform: translateY(-20px); transition: all 0.3s; pointer-events: none; }
.toast.show { opacity: 1; transform: translateY(0); }
.toast.success { background: linear-gradient(135deg, var(--success), #4a7a5c); box-shadow: 0 4px 20px rgba(91, 140, 110, 0.2); }
.toast.error { background: linear-gradient(135deg, var(--danger), #c05050); box-shadow: 0 4px 20px rgba(224, 96, 96, 0.2); }

@media (max-width: 1200px) {
  .poc-grid { grid-template-columns: repeat(2, 1fr); }
  .form-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .poc-grid { grid-template-columns: 1fr; }
  .filter-section { flex-direction: column; align-items: stretch; }
  .filter-group { width: 100%; }
  .filter-select { flex: 1; min-width: auto; }
  .btn-add { width: 100%; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
