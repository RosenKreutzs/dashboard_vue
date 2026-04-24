<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = 'http://localhost:5000'
const allFoods = ref([])
const selectedDate = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

// 弹窗状态
const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const showDeleteConfirm = ref(false)
const deleteTargetId = ref(null)

const greaseMap = {
  '清淡': 'low',
  '适中': 'medium',
  '重油': 'high'
}

const defaultForm = () => ({
  name: '',
  time: '',
  meal: '早餐',
  grease: '清淡',
  greaseLevel: 'low',
  description: ''
})

const formData = ref(defaultForm())
const formErrors = ref({})

// 获取所有食物数据
const fetchFoods = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/foods`)
    const data = await res.json()
    allFoods.value = Array.isArray(data) ? data : (data.data || [])
    // 默认选最新日期
    if (allFoods.value.length > 0) {
      const dates = [...new Set(allFoods.value.map(f => f.time))].sort((a, b) => {
        return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'))
      })
      if (!selectedDate.value) {
        selectedDate.value = dates[0]
      }
    }
  } catch (err) {
    console.error('加载失败:', err)
    showToast('数据加载失败', 'error')
  }
}

// 可用日期列表（排序后）
const availableDates = computed(() => {
  const dates = [...new Set(allFoods.value.map(f => f.time))].sort((a, b) => {
    return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'))
  })
  return dates
})

// 当前日期的食物
const filteredFoods = computed(() => {
  return allFoods.value.filter(f => f.time === selectedDate.value)
})

const breakfastFoods = computed(() => filteredFoods.value.filter(f => f.meal === '早餐'))
const lunchFoods = computed(() => filteredFoods.value.filter(f => f.meal === '午餐'))
const dinnerFoods = computed(() => filteredFoods.value.filter(f => f.meal === '晚餐'))

// 将 YYYY/MM/DD 格式转为中文星期显示
const formattedDate = computed(() => {
  if (!selectedDate.value) return ''
  const parts = selectedDate.value.split('/')
  if (parts.length !== 3) return selectedDate.value
  const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
  if (isNaN(d.getTime())) return selectedDate.value
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${parts[0]}年${parts[1]}月${parts[2]}日 ${weekdays[d.getDay()]}`
})

// 日期 input value（YYYY-MM-DD）
const dateInputValue = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.replace(/\//g, '-')
})

// 处理日期 input 变化
const onDateInputChange = (e) => {
  const val = e.target.value // YYYY-MM-DD
  if (val) {
    selectedDate.value = val.replace(/-/g, '/')
  }
}

// 前一天
const prevDay = () => {
  if (!selectedDate.value) return
  const parts = selectedDate.value.split('/')
  const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
  d.setDate(d.getDate() - 1)
  selectedDate.value = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 后一天
const nextDay = () => {
  if (!selectedDate.value) return
  const parts = selectedDate.value.split('/')
  const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
  d.setDate(d.getDate() + 1)
  selectedDate.value = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 打开新增弹窗
const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  formData.value.time = dateInputValue.value || new Date().toISOString().slice(0, 10)
  formErrors.value = {}
  showFormModal.value = true
}

// 打开编辑弹窗
const openEditModal = (food) => {
  isEditing.value = true
  editingId.value = food.id
  formData.value = {
    name: food.name,
    time: food.time.replace(/\//g, '-'),
    meal: food.meal,
    grease: food.grease,
    greaseLevel: food.greaseLevel,
    description: food.description
  }
  formErrors.value = {}
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  formErrors.value = {}
}

// 油腻度选择自动映射 greaseLevel
const onGreaseChange = () => {
  formData.value.greaseLevel = greaseMap[formData.value.grease] || 'low'
}

// 表单验证
const validateForm = () => {
  const errors = {}
  if (!formData.value.name?.trim()) errors.name = '菜品名称不能为空'
  if (!formData.value.time) errors.time = '日期不能为空'
  if (!formData.value.meal) errors.meal = '餐次不能为空'
  if (!formData.value.grease) errors.grease = '油腻度不能为空'
  if (!formData.value.description?.trim()) errors.description = '描述不能为空'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const submitForm = async () => {
  if (!validateForm()) return
  const timeFormatted = formData.value.time.replace(/-/g, '/')
  const payload = {
    name: formData.value.name.trim(),
    time: timeFormatted,
    meal: formData.value.meal,
    grease: formData.value.grease,
    greaseLevel: greaseMap[formData.value.grease] || 'low',
    description: formData.value.description.trim()
  }
  try {
    const url = isEditing.value
      ? `${API_BASE}/api/foods/${editingId.value}`
      : `${API_BASE}/api/foods`
    const res = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('user_token')}`
      },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      showToast(isEditing.value ? '编辑成功' : '新增成功', 'success')
      closeFormModal()
      await fetchFoods()
      // 新增时跳到新增菜品的日期
      if (!isEditing.value) {
        selectedDate.value = timeFormatted
      }
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.message || '操作失败', 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('网络错误，请稍后重试', 'error')
  }
}

const confirmDelete = (id) => {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

const executeDelete = async () => {
  if (!deleteTargetId.value) return
  try {
    const res = await fetch(`${API_BASE}/api/foods/${deleteTargetId.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` }
    })
    if (res.ok) {
      showToast('删除成功', 'success')
      await fetchFoods()
    } else {
      showToast('删除失败', 'error')
    }
  } catch (e) {
    showToast('删除失败', 'error')
  }
  showDeleteConfirm.value = false
  deleteTargetId.value = null
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const greaseLabelClass = (greaseLevel) => {
  if (greaseLevel === 'low') return 'grease-low'
  if (greaseLevel === 'medium') return 'grease-medium'
  if (greaseLevel === 'high') return 'grease-high'
  return ''
}

onMounted(() => { fetchFoods() })
</script>

<template>
  <div class="food-view">
    <!-- 顶部日期选择器区域 -->
    <div class="date-bar glass-card">
      <div class="date-nav">
        <button class="nav-btn" @click="prevDay" title="前一天">&#8249;</button>
        <input
          type="date"
          class="date-input"
          :value="dateInputValue"
          @change="onDateInputChange"
        />
        <button class="nav-btn" @click="nextDay" title="后一天">&#8250;</button>
      </div>
      <div class="date-display">{{ formattedDate }}</div>
      <button class="btn-add" @click="openAddModal">+ 新增菜品</button>
    </div>

    <!-- 三列三餐布局 -->
    <div class="meals-grid">
      <!-- 早餐 -->
      <div class="meal-col">
        <div class="meal-header breakfast-header">
          <span class="meal-icon">🌅</span>
          <span class="meal-title">早餐</span>
          <span class="meal-count">{{ breakfastFoods.length }} 道菜</span>
        </div>
        <div class="food-list">
          <div v-if="breakfastFoods.length === 0" class="empty-meal">
            <span>暂无菜品</span>
          </div>
          <div
            v-for="food in breakfastFoods"
            :key="food.id"
            class="food-card"
            :class="food.greaseLevel"
          >
            <div class="food-card-header">
              <span class="food-name">{{ food.name }}</span>
              <div class="food-actions">
                <button class="icon-btn edit-btn" @click="openEditModal(food)" title="编辑">✏️</button>
                <button class="icon-btn delete-btn" @click="confirmDelete(food.id)" title="删除">🗑️</button>
              </div>
            </div>
            <p class="food-desc">{{ food.description }}</p>
            <div class="food-footer">
              <span class="grease-tag" :class="greaseLabelClass(food.greaseLevel)">
                <span class="grease-dot"></span>{{ food.grease }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 午餐 -->
      <div class="meal-col">
        <div class="meal-header lunch-header">
          <span class="meal-icon">☀️</span>
          <span class="meal-title">午餐</span>
          <span class="meal-count">{{ lunchFoods.length }} 道菜</span>
        </div>
        <div class="food-list">
          <div v-if="lunchFoods.length === 0" class="empty-meal">
            <span>暂无菜品</span>
          </div>
          <div
            v-for="food in lunchFoods"
            :key="food.id"
            class="food-card"
            :class="food.greaseLevel"
          >
            <div class="food-card-header">
              <span class="food-name">{{ food.name }}</span>
              <div class="food-actions">
                <button class="icon-btn edit-btn" @click="openEditModal(food)" title="编辑">✏️</button>
                <button class="icon-btn delete-btn" @click="confirmDelete(food.id)" title="删除">🗑️</button>
              </div>
            </div>
            <p class="food-desc">{{ food.description }}</p>
            <div class="food-footer">
              <span class="grease-tag" :class="greaseLabelClass(food.greaseLevel)">
                <span class="grease-dot"></span>{{ food.grease }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 晚餐 -->
      <div class="meal-col">
        <div class="meal-header dinner-header">
          <span class="meal-icon">🌙</span>
          <span class="meal-title">晚餐</span>
          <span class="meal-count">{{ dinnerFoods.length }} 道菜</span>
        </div>
        <div class="food-list">
          <div v-if="dinnerFoods.length === 0" class="empty-meal">
            <span>暂无菜品</span>
          </div>
          <div
            v-for="food in dinnerFoods"
            :key="food.id"
            class="food-card"
            :class="food.greaseLevel"
          >
            <div class="food-card-header">
              <span class="food-name">{{ food.name }}</span>
              <div class="food-actions">
                <button class="icon-btn edit-btn" @click="openEditModal(food)" title="编辑">✏️</button>
                <button class="icon-btn delete-btn" @click="confirmDelete(food.id)" title="删除">🗑️</button>
              </div>
            </div>
            <p class="food-desc">{{ food.description }}</p>
            <div class="food-footer">
              <span class="grease-tag" :class="greaseLabelClass(food.greaseLevel)">
                <span class="grease-dot"></span>{{ food.grease }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div class="modal-overlay" :class="{ active: showFormModal }" @click="closeFormModal">
      <div class="modal-content form-modal-content" v-if="showFormModal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? '编辑菜品' : '新增菜品' }}</h3>
          <button class="modal-close" @click="closeFormModal">×</button>
        </div>
        <div class="modal-body form-body">
          <div class="form-group">
            <label>菜品名称 <span class="required">*</span></label>
            <input v-model="formData.name" type="text" placeholder="请输入菜品名称" :class="{ error: formErrors.name }" />
            <span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span>
          </div>
          <div class="form-group">
            <label>日期 <span class="required">*</span></label>
            <input v-model="formData.time" type="date" :class="{ error: formErrors.time }" />
            <span v-if="formErrors.time" class="error-text">{{ formErrors.time }}</span>
          </div>
          <div class="form-group">
            <label>餐次 <span class="required">*</span></label>
            <select v-model="formData.meal" :class="{ error: formErrors.meal }">
              <option value="早餐">早餐</option>
              <option value="午餐">午餐</option>
              <option value="晚餐">晚餐</option>
            </select>
            <span v-if="formErrors.meal" class="error-text">{{ formErrors.meal }}</span>
          </div>
          <div class="form-group">
            <label>油腻度 <span class="required">*</span></label>
            <select v-model="formData.grease" :class="{ error: formErrors.grease }" @change="onGreaseChange">
              <option value="清淡">清淡</option>
              <option value="适中">适中</option>
              <option value="重油">重油</option>
            </select>
            <span v-if="formErrors.grease" class="error-text">{{ formErrors.grease }}</span>
          </div>
          <div class="form-group form-group-full">
            <label>菜品描述 <span class="required">*</span></label>
            <textarea
              v-model="formData.description"
              placeholder="请输入菜品描述"
              rows="4"
              :class="{ error: formErrors.description }"
            ></textarea>
            <span v-if="formErrors.description" class="error-text">{{ formErrors.description }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeFormModal">取消</button>
          <button class="btn-save" @click="submitForm">保存</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div class="modal-overlay" :class="{ active: showDeleteConfirm }" @click="showDeleteConfirm = false">
      <div class="modal-content confirm-modal-content" v-if="showDeleteConfirm" @click.stop>
        <div class="confirm-body">
          <div class="confirm-icon">⚠️</div>
          <h3>确认删除</h3>
          <p>确定要删除该菜品吗？此操作不可撤销。</p>
        </div>
        <div class="confirm-footer">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="executeDelete">确认删除</button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div class="toast" :class="[toast.type, { show: toast.show }]">{{ toast.message }}</div>
  </div>
</template>

<style scoped>
.food-view {
  width: 100%;
}

/* 顶部日期栏 */
.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-glow);
  background: rgba(91, 140, 110, 0.06);
  color: var(--primary);
  font-size: 22px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  line-height: 1;
  padding: 0;
}

.nav-btn:hover {
  background: rgba(91, 140, 110, 0.15);
  border-color: var(--primary);
}

.date-input {
  padding: 8px 14px;
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 8px rgba(91, 140, 110, 0.15);
}

.date-display {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.5px;
  flex: 1;
  text-align: center;
  white-space: nowrap;
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

/* 三列布局 */
.meals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.meal-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.breakfast-header { border-top: 3px solid #f9a825; }
.lunch-header { border-top: 3px solid var(--accent); }
.dinner-header { border-top: 3px solid #5b6abf; }

.meal-icon { font-size: 22px; }

.meal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.meal-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(91, 140, 110, 0.1);
  border-radius: 20px;
  padding: 3px 10px;
}

/* 食物列表 */
.food-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 80px;
}

.empty-meal {
  text-align: center;
  padding: 32px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border: 1.5px dashed rgba(91, 140, 110, 0.2);
}

/* 菜品卡片 */
.food-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.food-card.low { border-left-color: var(--success); }
.food-card.medium { border-left-color: var(--warning); }
.food-card.high { border-left-color: var(--danger); }

.food-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.food-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.food-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(91, 140, 110, 0.2);
  background: rgba(91, 140, 110, 0.06);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: all 0.3s;
  padding: 0;
}

.edit-btn:hover { background: rgba(91, 140, 110, 0.15); border-color: var(--secondary); }
.delete-btn:hover { background: rgba(224, 96, 96, 0.15); border-color: var(--danger); }

.food-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.food-footer {
  display: flex;
  align-items: center;
}

.grease-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.grease-tag.grease-low {
  background: rgba(91, 140, 110, 0.12);
  color: var(--success);
}

.grease-tag.grease-medium {
  background: rgba(232, 168, 124, 0.15);
  color: var(--warning);
}

.grease-tag.grease-high {
  background: rgba(224, 96, 96, 0.12);
  color: var(--danger);
}

.grease-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.grease-low .grease-dot { background: var(--success); }
.grease-medium .grease-dot { background: var(--warning); }
.grease-high .grease-dot { background: var(--danger); }

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

.modal-close:hover { color: var(--text-primary); }

/* 表单弹窗 */
.form-modal-content {
  max-width: 520px;
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
.form-group select,
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
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 8px rgba(91, 140, 110, 0.15);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: var(--danger);
}

.form-group textarea {
  resize: vertical;
  min-height: 90px;
}

.required { color: var(--danger); }
.error-text { font-size: 12px; color: var(--danger); }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-glow);
}

/* 按钮 */
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

.btn-cancel:hover { background: rgba(0, 0, 0, 0.08); }

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

/* 删除确认弹窗 */
.confirm-modal-content {
  max-width: 400px;
  text-align: center;
}

.confirm-body { padding: 20px 0; }
.confirm-icon { font-size: 48px; margin-bottom: 15px; }
.confirm-body h3 { font-size: 20px; color: var(--text-primary); margin-bottom: 10px; }
.confirm-body p { font-size: 14px; color: var(--text-secondary); }

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

.toast.show { opacity: 1; transform: translateY(0); }
.toast.success { background: linear-gradient(135deg, var(--success), #4a7a5c); box-shadow: 0 4px 20px rgba(91, 140, 110, 0.2); }
.toast.error { background: linear-gradient(135deg, var(--danger), #c05050); box-shadow: 0 4px 20px rgba(224, 96, 96, 0.2); }

/* glass-card 复用 AppLayout 样式 */
.glass-card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-glow);
}

/* 响应式 */
@media (max-width: 1100px) {
  .meals-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 700px) {
  .meals-grid { grid-template-columns: 1fr; }
  .date-bar { flex-direction: column; align-items: stretch; gap: 12px; }
  .date-display { text-align: left; font-size: 15px; }
  .btn-add { width: 100%; }
  .form-body { grid-template-columns: 1fr; }
  .form-group-full { grid-column: auto; }
}
</style>
