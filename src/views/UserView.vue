<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNursingStore } from '../../database/nursingStore'

const nursingStore = useNursingStore()
const router = useRouter()

const searchKeyword = ref('')
const selectedSex = ref('')
const selectedEducation = ref('')
const selectedMaritalStatus = ref('')
const selectedActionCapability = ref('')

const showModal = ref(false)
const selectedVuln = ref(null)

const filteredVulns = computed(() => {
  return nursingStore.searchUsers(searchKeyword.value, {
    sex: selectedSex.value,
    education: selectedEducation.value,
    maritalStatus: selectedMaritalStatus.value,
    actionCapability: selectedActionCapability.value
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

const ActionCapabilities = [
  { label: '行动能力', value: '' },
  { label: '完全失能', value: '完全失能' },
  { label: '中度失能', value: '中度失能' },
  { label: '轻度失能', value: '轻度失能' },
  { label: '能力完好', value: '能力完好' }
]

const openDetail = (vuln) => {
  selectedVuln.value = vuln
  showModal.value = true
}

const downloadCode = (vuln, codeType) => {
  const code = codeType === 'poc' ? vuln.pocCode : vuln.expAttackerCode
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
</script>

<template>
  <div class="poc-view">
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
        
        <select v-model="selectedActionCapability" class="filter-select">
          <option v-for="item in ActionCapabilities" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
      
      <div class="result-count">
        找到 <span class="count">{{ filteredVulns.length }}</span> 个老人
      </div>
    </div>

    <!-- POC卡片列表 -->
    <div class="poc-grid">
      <div
        v-for="vuln in filteredVulns"
        :key="vuln.id"
        class="vuln-card glass-card"
        :class="vuln.actionCapability"
      >
        <div class="vuln-header">
          <h3 class="vuln-name">{{ vuln.name }}</h3>
          <span class="risk-badge" :class="vuln.actionCapability">{{ vuln.actionCapability }}</span>
        </div>

        <div class="vuln-meta">
<!--          编号-->
          <span class="meta-item">
            <span class="meta-icon">🎯</span>
            {{ vuln.id }}
          </span>
<!--          床号-->
          <span class="meta-item">
            <span class="meta-icon">💻</span>
            {{ vuln.bunk }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">📞</span>
            {{ vuln.telephoneNumber }}
          </span>
          <!--          电话-->
        </div>

        <p class="vuln-desc">{{ vuln.reasonCheckin }}</p>

        <div class="vuln-tags">

<!--          <span v-for="tag in vuln.tags" :key="tag" class="tag">{{ tag }}</span>-->
          <span class="tag">社保号：{{vuln.socialSecurityCardNumber}}</span>
          <span class="tag">紧急联系电话：{{vuln.emergencyContact}}</span>
<!--          社保号，紧急联系人，居住地址-->
        </div>

        <div class="vuln-stats">
          <div class="stat">
            <span class="stat-label">行动能力</span>
            <span class="stat-value">{{ vuln.actionCapability }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">年龄</span>
            <span class="stat-value">{{ vuln.age }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">平均血糖</span>
            <span class="stat-value">{{ vuln.healthInformation.MBG }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">平均血压</span>
            <span class="stat-value">{{ vuln.healthInformation.MAP }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">平均血脂</span>
            <span class="stat-value">{{ vuln.healthInformation.MBF }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">余额</span>
            <span class="stat-value">{{ vuln.remainingSum }}</span>
          </div>
        </div>

        <div class="vuln-actions">
          <button class="btn-detail" @click="openDetail(vuln)">
            📖 查看详情
          </button>
          <button class="btn-download" @click.stop="downloadCode(vuln, 'poc')">
            ⬇️ 下载相关文件
          </button>
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
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="vuln-section">
            <h4>📌 基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ID编号</span>
                <span class="info-value">{{ selectedVuln.id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">性别</span>
                <span class="info-value">{{ selectedVuln.sex }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">籍贯</span>
                <span class="info-value">{{ selectedVuln.nativePlace }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">床位</span>
                <span class="info-value">{{ selectedVuln.bunk }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-download" @click="downloadCode(selectedVuln, 'poc')">
              ⬇️ 下载相关文件
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poc-view {
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

.poc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.vuln-card {
  transition: all 0.3s;
}

.vuln-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 212, 255, 0.2);
}

.vuln-card.high { border-left: 3px solid var(--danger); }
.vuln-card.medium { border-left: 3px solid var(--warning); }
.vuln-card.low { border-left: 3px solid var(--success); }

.vuln-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.vuln-name {
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

.vuln-meta {
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

.vuln-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vuln-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.tag {
  padding: 4px 10px;
  background: rgba(0, 212, 255, 0.15);
  border-radius: 15px;
  font-size: 11px;
  color: var(--secondary);
}

.vuln-stats {
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

.vuln-actions {
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
  background: linear-gradient(135deg, var(--secondary), var(--primary));
  color: #fff;
}

.btn-download:hover {
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
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

.modal-content {
  background: #1a1a2e; /* 假设的背景色 */
  border-radius: 15px;
  padding: 30px;        /* 增加内边距 */
  min-width: 500px;
  position: relative;
  /* 其他你已有的样式 */
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

.modal-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-glow);
}

@media (max-width: 1200px) {
  .poc-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .poc-grid {
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
