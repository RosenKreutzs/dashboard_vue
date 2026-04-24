<script setup>
import { ref, computed, onMounted } from 'vue'

const workers = ref([])

const searchKeyword = ref('')
const selectedSex = ref('')
const selectedEducation = ref('')
const selectedMaritalStatus = ref('')
const selectedPoliticsStatus = ref('')

const showModal = ref(false)
const selectedVuln = ref(null)
const activeTab = ref('attacker')

// ===== 新增/编辑表单相关 =====
const showFormModal = ref(false)
const isEditMode = ref(false)
const formLoading = ref(false)
const editingWorkerId = ref(null)

const formData = ref({
  name: '',
  sex: '',
  age: '',
  nativePlace: '',
  domicileAddress: '',
  citizenship: '',
  nationality: '',
  politicsStatus: '',
  maritalStatus: '',
  certificateType: '',
  certificateNumber: '',
  education: '',
  originalUnits: '',
  originalOccupation: '',
  residentialAddress: '',
  telephoneNumber: '',
  emergencyContact: '',
  score: '',
  selfDescription: ''
})

const formErrors = ref({})

// ===== 删除确认相关 =====
const showDeleteConfirm = ref(false)
const deletingWorkerId = ref(null)
const deleteLoading = ref(false)

// ===== 照片上传相关 =====
const photoInput = ref(null)
const photoPreview = ref(null)
const selectedPhoto = ref(null)

// ===== Toast 提示相关 =====
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null

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

const PoliticsStatuses = [
  { label: '政治面貌', value: '' },
  { label: '群众', value: '群众' },
  { label: '党员', value: '党员' },
  { label: '其他', value: '其他' }
]

const CertificateTypes = [
  { label: '证件类型', value: '' },
  { label: '身份证', value: '身份证' },
  { label: '护照', value: '护照' },
  { label: '驾驶证', value: '驾驶证' },
  { label: '其他', value: '其他' }
]

// 获取护工列表
const fetchWorkers = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/workers')
    const data = await response.json()
    workers.value = data
  } catch (error) {
    console.error('数据加载失败:', error)
    showToast('数据加载失败', 'error')
  }
}

const searchWorkers = (keyword, filters = {}) => {
  let results = workers.value

  if (keyword) {
    const kw = keyword.toLowerCase()
    results = results.filter(v =>
        v.id.toLowerCase().includes(kw) ||
        v.name.toLowerCase().includes(kw) ||
        v.sex.toLowerCase().includes(kw) ||
        (v.nativePlace || '').toLowerCase().includes(kw) ||
        (v.domicileAddress || '').toLowerCase().includes(kw) ||
        (v.citizenship || '').toLowerCase().includes(kw) ||
        (v.nationality || '').toLowerCase().includes(kw) ||
        (v.politicsStatus || '').toLowerCase().includes(kw) ||
        (v.maritalStatus || '').toLowerCase().includes(kw) ||
        (v.certificateNumber || '').toLowerCase().includes(kw) ||
        (v.education || '').toLowerCase().includes(kw) ||
        (v.originalUnits || '').toLowerCase().includes(kw) ||
        (v.originalOccupation || '').toLowerCase().includes(kw) ||
        (v.residentialAddress || '').toLowerCase().includes(kw) ||
        (v.telephoneNumber || '').toLowerCase().includes(kw) ||
        (v.selfDescription || '').toLowerCase().includes(kw)
    )
  }

  if (filters.sex) {
    results = results.filter(v => v.sex === filters.sex)
  }
  if (filters.education) {
    results = results.filter(v => v.education === filters.education)
  }
  if (filters.maritalStatus) {
    results = results.filter(v => v.maritalStatus && v.maritalStatus.includes(filters.maritalStatus))
  }
  if (filters.politicsStatus) {
    results = results.filter(v => v.politicsStatus === filters.politicsStatus)
  }

  return results
}

const filteredVulns = computed(() => {
  return searchWorkers(searchKeyword.value, {
    sex: selectedSex.value,
    education: selectedEducation.value,
    maritalStatus: selectedMaritalStatus.value,
    politicsStatus: selectedPoliticsStatus.value
  })
})

const openDetail = (vuln) => {
  selectedVuln.value = vuln
  activeTab.value = 'attacker'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedVuln.value = null
}

// ===== 新增/编辑弹窗 =====
const openAddModal = () => {
  isEditMode.value = false
  editingWorkerId.value = null
  resetForm()
  formErrors.value = {}
  showFormModal.value = true
}

const openEditModal = (worker, event) => {
  if (event) event.stopPropagation()
  isEditMode.value = true
  editingWorkerId.value = worker.id
  formErrors.value = {}
  photoPreview.value = null
  selectedPhoto.value = null
  formData.value = {
    name: worker.name || '',
    sex: worker.sex || '',
    age: worker.age !== undefined && worker.age !== null ? String(worker.age) : '',
    nativePlace: worker.nativePlace || '',
    domicileAddress: worker.domicileAddress || '',
    citizenship: worker.citizenship || '',
    nationality: worker.nationality || '',
    politicsStatus: worker.politicsStatus || '',
    maritalStatus: worker.maritalStatus || '',
    certificateType: worker.certificateType || '',
    certificateNumber: worker.certificateNumber || '',
    education: worker.education || '',
    originalUnits: worker.originalUnits || '',
    originalOccupation: worker.originalOccupation || '',
    residentialAddress: worker.residentialAddress || '',
    telephoneNumber: worker.telephoneNumber || '',
    emergencyContact: worker.emergencyContact || '',
    score: worker.score !== undefined && worker.score !== null ? String(worker.score) : '',
    selfDescription: worker.selfDescription || '',
    photo: worker.photo || ''
  }
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  formErrors.value = {}
  photoPreview.value = null
  selectedPhoto.value = null
}

const resetForm = () => {
  formData.value = {
    name: '',
    sex: '',
    age: '',
    nativePlace: '',
    domicileAddress: '',
    citizenship: '',
    nationality: '',
    politicsStatus: '',
    maritalStatus: '',
    certificateType: '',
    certificateNumber: '',
    education: '',
    originalUnits: '',
    originalOccupation: '',
    residentialAddress: '',
    telephoneNumber: '',
    emergencyContact: '',
    score: '',
    selfDescription: '',
    photo: ''
  }
  photoPreview.value = null
  selectedPhoto.value = null
}

const triggerPhotoInput = () => {
  photoInput.value.click()
}

const handlePhotoSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showToast('仅支持 JPEG、PNG、WebP 格式的图片', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过 5MB', 'error')
    return
  }
  selectedPhoto.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { photoPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

// 表单验证
const validateForm = () => {
  const errors = {}
  const data = formData.value

  if (!data.name.trim()) {
    errors.name = '请输入姓名'
  }

  if (!data.sex) {
    errors.sex = '请选择性别'
  }

  if (!data.age && data.age !== 0) {
    errors.age = '请输入年龄'
  } else {
    const ageNum = Number(data.age)
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 150) {
      errors.age = '请输入有效的年龄(1-150)'
    }
  }

  if (!data.telephoneNumber.trim()) {
    errors.telephoneNumber = '请输入电话号码'
  } else if (!/^\d{11}$/.test(data.telephoneNumber.trim())) {
    errors.telephoneNumber = '电话号码必须为11位数字'
  }

  if (data.score !== '' && data.score !== undefined && data.score !== null) {
    const scoreNum = Number(data.score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 5) {
      errors.score = '评分必须在0-5之间'
    }
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// 保存护工（新增/编辑）
const saveWorker = async () => {
  if (!validateForm()) return

  formLoading.value = true
  try {
    const payload = {
      ...formData.value,
      age: Number(formData.value.age),
      score: formData.value.score !== '' ? Number(formData.value.score) : 0
    }

    let response
    if (isEditMode.value) {
      response = await fetch(`http://localhost:5000/api/workers/${editingWorkerId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(payload)
      })
    } else {
      response = await fetch('http://localhost:5000/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(payload)
      })
    }

    const result = await response.json()

    if (response.ok) {
      // 上传照片
      if (selectedPhoto.value) {
        try {
          const photoFormData = new FormData()
          photoFormData.append('photo', selectedPhoto.value)
          const workerId = isEditMode.value ? editingWorkerId.value : result.data?.id
          if (workerId) {
            await fetch(`http://localhost:5000/api/workers/${workerId}/photo`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` },
              body: photoFormData
            })
          }
        } catch (photoError) {
          console.error('照片上传失败:', photoError)
        }
      }
      showToast(isEditMode.value ? '编辑成功' : '新增成功', 'success')
      closeFormModal()
      await fetchWorkers()
    } else {
      showToast(result.message || '操作失败', 'error')
    }
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败，请检查网络连接', 'error')
  } finally {
    formLoading.value = false
  }
}

// ===== 删除功能 =====
const openDeleteConfirm = (worker, event) => {
  if (event) event.stopPropagation()
  deletingWorkerId.value = worker.id
  showDeleteConfirm.value = true
}

const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false
  deletingWorkerId.value = null
}

const confirmDelete = async () => {
  if (!deletingWorkerId.value) return

  deleteLoading.value = true
  try {
    const response = await fetch(`http://localhost:5000/api/workers/${deletingWorkerId.value}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('user_token')}`
      }
    })

    const result = await response.json()

    if (response.ok) {
      showToast('删除成功', 'success')
      closeDeleteConfirm()
      await fetchWorkers()
    } else {
      showToast(result.message || '删除失败', 'error')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败，请检查网络连接', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// ===== Toast 提示 =====
const showToast = (message, type = 'success') => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(() => {
  fetchWorkers()
})
</script>

<template>
  <div class="exp-view">
    <!-- 搜索和筛选区域 -->
    <div class="filter-section glass-card">
      <div class="search-box">
        <span class="search-icon">&#128269;</span>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索名称、描述..."
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <select v-model="selectedSex" class="filter-select">
          <option v-for="item in Sexes" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>

        <select v-model="selectedEducation" class="filter-select">
          <option v-for="item in Educations" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>

        <select v-model="selectedMaritalStatus" class="filter-select">
          <option v-for="item in MaritalStatuses" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>

        <select v-model="selectedPoliticsStatus" class="filter-select">
          <option v-for="item in PoliticsStatuses" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>

      <button class="btn-add-worker" @click="openAddModal">
        <span class="btn-icon">+</span> 新增护工
      </button>

      <div class="result-count">
        找到 <span class="count">{{ filteredVulns.length }}</span> 个护工
      </div>
    </div>

    <!-- EXP卡片列表 -->
    <div class="exp-grid">
      <div
        v-for="vuln in filteredVulns"
        :key="vuln.id"
        class="exp-card glass-card"
        :class="vuln.politicsStatus"
      >
        <div class="exp-header">
          <h3 class="exp-name">{{ vuln.name }}</h3>
          <div class="header-actions">
            <span class="risk-badge" :class="vuln.politicsStatus">{{ vuln.politicsStatus }}</span>
            <button class="icon-btn icon-edit" @click="openEditModal(vuln, $event)" title="编辑">&#9998;</button>
            <button class="icon-btn icon-delete" @click="openDeleteConfirm(vuln, $event)" title="删除">&#128465;</button>
          </div>
        </div>

        <div class="exp-tags">
          <span class="tag attacker">&#127919; {{ vuln.id }}</span>
          <span class="tag victim">&#128222; {{ vuln.telephoneNumber }}</span>
        </div>

        <p class="exp-desc">{{ vuln.selfDescription }}</p>

        <div class="exp-meta">
          <span class="meta-item">
            <span class="meta-icon">&#9889;</span>
            {{ vuln.education }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">&#128187;</span>
            {{ vuln.politicsStatus }}
          </span>
        </div>

        <div class="exp-stats">
          <div class="stat">
            <span class="stat-label">护工评分</span>
            <span class="stat-value">{{ vuln.score }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">年龄</span>
            <span class="stat-value">{{ vuln.age }}</span>
          </div>
        </div>

        <div class="exp-actions">
          <button class="btn-detail" @click="openDetail(vuln)">
            &#128214; 查看详情
          </button>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="filteredVulns.length === 0" class="empty-state">
      <div class="empty-icon">&#128165;</div>
      <h3>未找到匹配的护工</h3>
      <p>请尝试调整筛选条件</p>
    </div>

    <!-- 详情弹窗 -->
    <div class="modal-overlay" :class="{active: showModal}" @click="closeModal">
      <div class="modal-content modal-large" v-if="selectedVuln" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h3 class="modal-title">{{ selectedVuln.name }}</h3>
            <span class="risk-badge" :class="selectedVuln.id">{{ selectedVuln.id }}</span>
          </div>
          <div class="avatar-display">
            <img v-if="selectedVuln.photo"
                 :src="`http://localhost:5000/api/uploads/workers/${selectedVuln.photo}`"
                 :alt="selectedVuln.name"
                 class="avatar-img" />
            <div v-else class="avatar-placeholder">
              {{ selectedVuln.name ? selectedVuln.name.charAt(0) : '?' }}
            </div>
          </div>
          <button class="modal-close" @click="closeModal">&times;</button>
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
          <!-- 工作信息 -->
          <div class="vuln-section">
            <h4>💼 工作信息</h4>
            <div class="info-grid info-grid-auto">
              <div class="info-item"><span class="info-label">护工评分</span><span class="info-value">{{ selectedVuln.score != null ? selectedVuln.score + ' / 5.0' : '-' }}</span></div>
              <div class="info-item"><span class="info-label">原单位</span><span class="info-value">{{ selectedVuln.originalUnits }}</span></div>
              <div class="info-item"><span class="info-label">原职业</span><span class="info-value">{{ selectedVuln.originalOccupation }}</span></div>
            </div>
          </div>
          <!-- 个人描述 -->
          <div class="vuln-section" v-if="selectedVuln.selfDescription">
            <h4>📝 个人描述</h4>
            <div class="info-item info-item-full">
              <span class="info-label">自我描述</span>
              <span class="info-value">{{ selectedVuln.selfDescription }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑表单弹窗 -->
    <div class="modal-overlay" :class="{active: showFormModal}" @click="closeFormModal">
      <div class="modal-content modal-form" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditMode ? '编辑护工信息' : '新增护工信息' }}</h3>
          <button class="modal-close" @click="closeFormModal">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveWorker">
            <!-- 照片上传 -->
            <div class="photo-upload-section">
              <h4>📷 照片</h4>
              <div class="photo-upload-area" @click="triggerPhotoInput">
                <img v-if="photoPreview" :src="photoPreview" class="photo-preview" />
                <img v-else-if="formData.photo"
                     :src="`http://localhost:5000/api/uploads/workers/${formData.photo}`"
                     class="photo-preview" />
                <div v-else class="photo-placeholder">
                  <span class="upload-icon">📷</span>
                  <span class="upload-text">点击上传照片</span>
                </div>
              </div>
              <input type="file" ref="photoInput" accept="image/jpeg,image/png,image/webp"
                     @change="handlePhotoSelect" style="display:none" />
            </div>
            <!-- 基本信息 -->
            <div class="form-section">
              <h4 class="form-section-title">&#128204; 基本信息</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">
                    姓名 <span class="required">*</span>
                  </label>
                  <input v-model="formData.name" type="text" class="form-input" :class="{'input-error': formErrors.name}" placeholder="请输入姓名" />
                  <span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    性别 <span class="required">*</span>
                  </label>
                  <select v-model="formData.sex" class="form-input" :class="{'input-error': formErrors.sex}">
                    <option v-for="item in Sexes.filter(s => s.value !== '')" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                  <span v-if="formErrors.sex" class="error-text">{{ formErrors.sex }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    年龄 <span class="required">*</span>
                  </label>
                  <input v-model="formData.age" type="number" class="form-input" :class="{'input-error': formErrors.age}" placeholder="请输入年龄" />
                  <span v-if="formErrors.age" class="error-text">{{ formErrors.age }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">籍贯</label>
                  <input v-model="formData.nativePlace" type="text" class="form-input" placeholder="请输入籍贯" />
                </div>

                <div class="form-group">
                  <label class="form-label">国籍</label>
                  <input v-model="formData.citizenship" type="text" class="form-input" placeholder="请输入国籍" />
                </div>

                <div class="form-group">
                  <label class="form-label">民族</label>
                  <input v-model="formData.nationality" type="text" class="form-input" placeholder="请输入民族" />
                </div>

                <div class="form-group">
                  <label class="form-label">政治面貌</label>
                  <select v-model="formData.politicsStatus" class="form-input">
                    <option v-for="item in PoliticsStatuses.filter(s => s.value !== '')" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">婚姻状况</label>
                  <select v-model="formData.maritalStatus" class="form-input">
                    <option v-for="item in MaritalStatuses.filter(s => s.value !== '')" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">文化程度</label>
                  <select v-model="formData.education" class="form-input">
                    <option v-for="item in Educations.filter(s => s.value !== '')" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 证件信息 -->
            <div class="form-section">
              <h4 class="form-section-title">&#128195; 证件信息</h4>
              <div class="form-grid form-grid-2">
                <div class="form-group">
                  <label class="form-label">证件类型</label>
                  <select v-model="formData.certificateType" class="form-input">
                    <option v-for="item in CertificateTypes" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">证件号码</label>
                  <input v-model="formData.certificateNumber" type="text" class="form-input" placeholder="请输入证件号码" />
                </div>
              </div>
            </div>

            <!-- 联系信息 -->
            <div class="form-section">
              <h4 class="form-section-title">&#128222; 联系信息</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">
                    电话 <span class="required">*</span>
                  </label>
                  <input v-model="formData.telephoneNumber" type="text" class="form-input" :class="{'input-error': formErrors.telephoneNumber}" placeholder="请输入11位电话号码" />
                  <span v-if="formErrors.telephoneNumber" class="error-text">{{ formErrors.telephoneNumber }}</span>
                </div>

                <div class="form-group">
                  <label class="form-label">紧急联系电话</label>
                  <input v-model="formData.emergencyContact" type="text" class="form-input" placeholder="请输入紧急联系电话" />
                </div>

                <div class="form-group">
                  <label class="form-label">现住址</label>
                  <input v-model="formData.residentialAddress" type="text" class="form-input" placeholder="请输入现住址" />
                </div>

                <div class="form-group">
                  <label class="form-label">原住址</label>
                  <input v-model="formData.domicileAddress" type="text" class="form-input" placeholder="请输入原住址" />
                </div>
              </div>
            </div>

            <!-- 工作信息 -->
            <div class="form-section">
              <h4 class="form-section-title">&#128188; 工作信息</h4>
              <div class="form-grid form-grid-2">
                <div class="form-group">
                  <label class="form-label">原单位</label>
                  <input v-model="formData.originalUnits" type="text" class="form-input" placeholder="请输入原单位" />
                </div>

                <div class="form-group">
                  <label class="form-label">原职业</label>
                  <input v-model="formData.originalOccupation" type="text" class="form-input" placeholder="请输入原职业" />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    护工评分
                  </label>
                  <input v-model="formData.score" type="number" step="0.1" min="0" max="5" class="form-input" :class="{'input-error': formErrors.score}" placeholder="0-5分" />
                  <span v-if="formErrors.score" class="error-text">{{ formErrors.score }}</span>
                </div>
              </div>
            </div>

            <!-- 个人描述 -->
            <div class="form-section">
              <h4 class="form-section-title">&#128221; 个人描述</h4>
              <div class="form-group form-group-full">
                <textarea v-model="formData.selfDescription" class="form-textarea" rows="4" placeholder="请输入自我描述"></textarea>
              </div>
            </div>

            <!-- 底部按钮 -->
            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeFormModal">取消</button>
              <button type="submit" class="btn-save" :disabled="formLoading">
                {{ formLoading ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div class="modal-overlay" :class="{active: showDeleteConfirm}" @click="closeDeleteConfirm">
      <div class="modal-content modal-confirm" @click.stop>
        <div class="confirm-header">
          <span class="confirm-icon">&#9888;</span>
          <h3 class="confirm-title">确认删除</h3>
        </div>
        <p class="confirm-message">确定要删除该护工信息吗？此操作不可撤销。</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="closeDeleteConfirm">取消</button>
          <button class="btn-delete" :disabled="deleteLoading" @click="confirmDelete">
            {{ deleteLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '&#10004;' : '&#10008;' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.exp-view {
  width: 100%;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 20px;
}

.search-box {
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 10px;
  padding: 0 15px;
}

.search-icon {
  font-size: 16px;
  margin-right: 10px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 0;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 150px;
  padding: 10px 15px;
  background: var(--bg-card);
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
}

.result-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.result-count .count {
  color: var(--secondary);
  font-weight: 600;
}

.btn-add-worker {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-worker:hover {
  background: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.25);
}

.btn-icon {
  font-size: 18px;
  font-weight: 700;
}

.exp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.exp-card {
  transition: all 0.3s;
}

.exp-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(91, 140, 110, 0.12);
}

.exp-card.high { border-left: 3px solid var(--danger); }
.exp-card.medium { border-left: 3px solid var(--warning); }
.exp-card.low { border-left: 3px solid var(--success); }

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.exp-name {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
}

.icon-edit {
  color: var(--primary);
  background: rgba(91, 140, 110, 0.1);
}

.icon-edit:hover {
  background: rgba(91, 140, 110, 0.2);
  transform: scale(1.1);
}

.icon-delete {
  color: var(--danger);
  background: rgba(224, 96, 96, 0.1);
}

.icon-delete:hover {
  background: rgba(224, 96, 96, 0.2);
  transform: scale(1.1);
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.high { background: rgba(224, 96, 96, 0.12); color: var(--danger); }
.risk-badge.medium { background: rgba(232, 168, 124, 0.12); color: var(--warning); }
.risk-badge.low { background: rgba(91, 140, 110, 0.12); color: var(--success); }

.exp-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 11px;
}

.tag.attacker {
  background: rgba(224, 96, 96, 0.1);
  color: var(--danger);
}

.tag.victim {
  background: rgba(91, 140, 110, 0.1);
  color: var(--success);
}

.exp-desc {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exp-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-primary);
}

.meta-icon {
  font-size: 14px;
}

.exp-stats {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: var(--text-primary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--secondary);
}

.exp-actions {
  display: flex;
  gap: 10px;
}

.btn-detail, .btn-download {
  flex: 1;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-detail {
  background: rgba(91, 140, 110, 0.08);
  color: var(--primary);
  border: 1px solid rgba(91, 140, 110, 0.2);
}

.btn-detail:hover {
  background: rgba(91, 140, 110, 0.15);
}

.btn-download {
  background: linear-gradient(135deg, var(--danger), #c05050);
  color: #fff;
}

.btn-download:hover {
  box-shadow: 0 4px 16px rgba(224, 96, 96, 0.3);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.empty-state p {
  color: var(--text-secondary);
}

.modal-large {
  max-width: 800px;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 15px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
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

.vuln-section {
  margin-bottom: 25px;
}

.vuln-section h4 {
  font-family: var(--font-heading);
  font-size: 14px;
  color: var(--primary);
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-grid-auto {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

/* ===== 表单弹窗样式 ===== */
.modal-form {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section-title {
  font-family: var(--font-heading);
  font-size: 14px;
  color: var(--primary);
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.form-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.required {
  color: var(--danger);
}

.form-input, .form-textarea {
  padding: 10px 14px;
  background: #f8f9f5;
  border: 1px solid rgba(91, 140, 110, 0.2);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  width: 100%;
}

.form-input:focus, .form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 8px rgba(91, 140, 110, 0.15);
}

.input-error {
  border-color: var(--danger) !important;
  box-shadow: 0 0 8px rgba(224, 96, 96, 0.2) !important;
}

.error-text {
  font-size: 12px;
  color: var(--danger);
}

.form-textarea {
  resize: vertical;
  font-family: var(--font-main);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn-cancel {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid rgba(91, 140, 110, 0.2);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
}

.btn-save {
  padding: 10px 28px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save:hover:not(:disabled) {
  background: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.25);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== 删除确认对话框样式 ===== */
.modal-confirm {
  max-width: 420px;
  text-align: center;
  padding: 32px;
}

.confirm-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.confirm-icon {
  font-size: 48px;
  color: var(--danger);
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 20px;
  color: var(--text-primary);
  font-weight: 600;
}

.confirm-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-delete {
  padding: 10px 28px;
  background: linear-gradient(135deg, var(--danger), #c05050);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(224, 96, 96, 0.3);
  transform: translateY(-2px);
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== Toast 提示样式 ===== */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 14px 24px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.toast.success {
  background: rgba(91, 140, 110, 0.1);
  border: 1px solid rgba(91, 140, 110, 0.2);
  color: var(--success);
}

.toast.error {
  background: rgba(224, 96, 96, 0.1);
  border: 1px solid rgba(224, 96, 96, 0.2);
  color: var(--danger);
}

.toast-icon {
  font-size: 18px;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.4s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.toast-enter-to, .toast-leave-from {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 1200px) {
  .exp-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ===== 照片展示与上传样式 ===== */
.avatar-display {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--secondary);
  flex-shrink: 0;
  margin-left: auto;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
}

.photo-upload-section {
  margin-bottom: 20px;
  text-align: center;
}

.photo-upload-section h4 {
  font-family: var(--font-heading);
  font-size: 14px;
  color: var(--primary);
  margin-bottom: 0;
  text-align: left;
}

.photo-upload-area {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px dashed var(--border-glow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
  transition: border-color 0.3s;
}

.photo-upload-area:hover {
  border-color: var(--primary);
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  text-align: center;
  color: var(--text-secondary);
}

.upload-icon {
  font-size: 28px;
  display: block;
}

.upload-text {
  font-size: 12px;
}

@media (max-width: 768px) {
  .exp-grid {
    grid-template-columns: 1fr;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
    min-width: auto;
  }

  .form-grid, .form-grid-2 {
    grid-template-columns: 1fr;
  }

  .modal-form, .modal-confirm {
    width: 95%;
    padding: 20px;
  }
}
</style>
