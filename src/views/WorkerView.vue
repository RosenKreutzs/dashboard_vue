<script setup>
import { ref, computed,onMounted } from 'vue'
const  workers= ref([])

const searchKeyword = ref('')
const selectedSex = ref('')
const selectedEducation = ref('')
const selectedMaritalStatus = ref('')
const selectedPoliticsStatus = ref('')

const showModal = ref(false)
const selectedVuln = ref(null)
const activeTab = ref('attacker')


const searchWorkers = (keyword, filters = {}) => {
  let results = workers.value

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
        v.selfDescription.toLowerCase().includes(kw)
    )
  }

  if (filters.sex) {
    results = results.filter(v => v.sex === filters.sex)
  }
  if (filters.education) {
    results = results.filter(v => v.education === filters.education)
  }
  if (filters.maritalStatus) {
    results = results.filter(v => v.maritalStatus.includes(filters.maritalStatus))
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
  { label: '丧偶', value: '丧偶' },
]

const PoliticsStatuses = [
  { label: '政治面貌', value: '' },
  { label: '群众', value: '群众' },
  { label: '党员', value: '党员' },
  { label: '其他', value: '其他' }
]

const openDetail = (vuln) => {
  selectedVuln.value = vuln
  activeTab.value = 'attacker'
  showModal.value = true
}

const downloadExp = (vuln, codeType) => {
  const code = codeType === 'attacker' ? vuln.expAttackerCode : vuln.expVictimCode
  const filename = `${vuln.name}_${codeType}.c`
  
  const blob = new Blob([code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const closeModal = () => {
  showModal.value = false
  selectedVuln.value = null
}
onMounted(async () => {
  try {
    // 调后端接口
    const response = await fetch('http://localhost:5000/api/workers')
    const data = await response.json()
    workers.value = data

  } catch (error) {
    console.error("数据加载失败:", error)
  }
})

</script>

<template>
  <div class="exp-view">
    <!-- 搜索和筛选区域 -->
    <div class="filter-section glass-card">
      <div class="search-box">
        <span class="search-icon">🔍</span>
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
          <span class="risk-badge" :class="vuln.politicsStatus">{{ vuln.politicsStatus }}</span>
        </div>
        
        <div class="exp-tags">
          <span class="tag attacker">🎯 {{ vuln.id }}</span>
          <span class="tag victim">🛡️ {{ vuln.telephoneNumber }}</span>
        </div>
        
        <p class="exp-desc">{{ vuln.selfDescription }}</p>
        
        <div class="exp-meta">
<!--          编号-->
          <span class="meta-item">
            <span class="meta-icon">⚡</span>
            {{ vuln.education }}
          </span>
          <!--          电话号-->
          <span class="meta-item">
            <span class="meta-icon">💻</span>
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
            📖 查看详情
          </button>
          <button class="btn-download" @click.stop="downloadExp(vuln, 'attacker')">
            ⬇️ 下载相关文件
          </button>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div v-if="filteredVulns.length === 0" class="empty-state">
      <div class="empty-icon">💥</div>
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
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <!-- 基本信息 -->
          <div class="vuln-section">
            <h4>📌 基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">政治面貌</span>
                <span class="info-value">{{ selectedVuln.politicsStatus }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">年龄</span>
                <span class="info-value">{{ selectedVuln.age }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">护工评分</span>
                <span class="info-value">{{ selectedVuln.score }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">电话</span>
                <span class="info-value">{{ selectedVuln.telephoneNumber }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
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
  background: rgba(0, 0, 0, 0.3);
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
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

.result-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.result-count .count {
  color: var(--secondary);
  font-weight: 600;
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
  box-shadow: 0 15px 40px rgba(0, 212, 255, 0.2);
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
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.risk-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.risk-badge.high { background: rgba(255, 51, 102, 0.2); color: var(--danger); }
.risk-badge.medium { background: rgba(255, 170, 0, 0.2); color: var(--warning); }
.risk-badge.low { background: rgba(0, 255, 157, 0.2); color: var(--success); }

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
  background: rgba(255, 51, 102, 0.15);
  color: var(--danger);
}

.tag.victim {
  background: rgba(0, 255, 157, 0.15);
  color: var(--success);
}

.exp-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.6);
}

.meta-icon {
  font-size: 14px;
}

.exp-stats {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
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
  background: rgba(0, 212, 255, 0.15);
  color: var(--secondary);
  border: 1px solid var(--border-glow);
}

.btn-detail:hover {
  background: rgba(0, 212, 255, 0.25);
}

.btn-download {
  background: linear-gradient(135deg, var(--danger), #cc2952);
  color: #fff;
}

.btn-download:hover {
  box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
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
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
}

.modal-large {
  max-width: 1000px;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 添加这部分样式 */
.modal-header {
  display: flex;
  justify-content: space-between; /* 将标题推向左边，关闭按钮推向右边 */
  align-items: center;           /* 垂直方向居中对齐 */
  margin-bottom: 20px;           /* 与下方内容保持一定间距 */
  width: 100%;                   /* 确保占满全宽 */
}

/* 确保标题包裹层也是 flex，让名字和勋章在一行（你已有的代码里应该有了） */
.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 微调关闭按钮 */
.modal-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7); /* 稍微降暗一点，鼠标悬停再变亮 */
  font-size: 28px;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #fff; /* 鼠标移上去变白 */
}

.code-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glow);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(0, 212, 255, 0.1);
}

.tab-btn.active {
  background: rgba(0, 212, 255, 0.2);
  border-color: var(--secondary);
  color: var(--secondary);
}

.code-section {
  margin-bottom: 25px;
}

.code-header {
  margin-bottom: 15px;
}

.code-header h4 {
  font-family: 'Orbitron', sans-serif;
  font-size: 15px;
  color: var(--secondary);
  margin-bottom: 5px;
}

.code-header p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.btn-download-full {
  margin-top: 15px;
  padding: 12px 25px;
  background: linear-gradient(135deg, var(--danger), #cc2952);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-download-full:hover {
  box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
}

.vuln-section {
  margin-bottom: 25px;
}

.vuln-section h4 {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  color: var(--secondary);
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #fff;
}

.platform-list, .cpu-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.platform-item {
  padding: 6px 14px;
  background: rgba(0, 255, 157, 0.15);
  border-radius: 20px;
  font-size: 12px;
  color: var(--success);
}

.cpu-item {
  padding: 6px 14px;
  background: rgba(0, 212, 255, 0.15);
  border-radius: 20px;
  font-size: 12px;
  color: var(--secondary);
}

@media (max-width: 1200px) {
  .exp-grid {
    grid-template-columns: repeat(2, 1fr);
  }
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
}
</style>
