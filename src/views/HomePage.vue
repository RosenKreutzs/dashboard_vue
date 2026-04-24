<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'

const router = useRouter()

// ========== 用户与问候信息 ==========
const userName = ref('管理员')
const greeting = ref('早上好')
const currentDate = ref('')
const tips = ref('今天也要好好照顾每一位老人哦')

const updateGreetingAndDate = () => {
  const hour = new Date().getHours()
  if (hour < 12) {
    greeting.value = '早上好'
    tips.value = '清晨的阳光温暖人心，愿今天一切顺遂'
  } else if (hour < 18) {
    greeting.value = '下午好'
    tips.value = '午后时光，记得关心老人们的午休情况'
  } else {
    greeting.value = '晚上好'
    tips.value = '夜幕降临，愿每位老人都能安心入眠'
  }

  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  currentDate.value = `${y}年${m}月${d}日 ${weekdays[now.getDay()]}`
}

// ========== 数据状态 ==========
const foods = ref([])
const scoringList = ref([])
const users = ref([])
const workers = ref([])
const loading = ref(true)

const animatedStats = reactive({
  elderCount: 0,
  workerCount: 0,
  mealCount: 0,
  avgScore: 0
})

const pieChartRef = ref(null)
let pieChartInstance = null
let streamInterval = null

// ========== 数字动画 ==========
const animateNumber = (target, key, endValue, duration = 600) => {
  const startTime = Date.now()
  const startValue = target[key]
  const diff = endValue - startValue

  const update = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    target[key] = Math.round((startValue + diff * easeProgress) * 10) / 10
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

// ========== 饼图配置 ==========
const initPieChart = () => {
  if (!pieChartRef.value || !users.value.length) return

  if (pieChartInstance) {
    pieChartInstance.dispose()
  }

  pieChartInstance = echarts.init(pieChartRef.value)

  const actionCapabilitys = {}
  users.value.forEach(v => {
    const key = v.actionCapability || '未知'
    actionCapabilitys[key] = (actionCapabilitys[key] || 0) + 1
  })

  const data = Object.entries(actionCapabilitys).map(([name, value]) => ({ name, value }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 位 ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(91,140,110,0.2)',
      textStyle: { color: '#3d3d3d' }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#6b6b6b', fontSize: 13 },
      itemGap: 16
    },
    series: [{
      type: 'pie',
      left: '-10%',
      radius: ['45%', '72%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: {
        show: true,
        formatter: '{c}',
        color: '#3d3d3d',
        fontSize: 13,
        fontWeight: 600
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 15,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0,0,0,0.1)'
        }
      },
      data: data,
      color: ['#5b8c6e', '#7ab68a', '#e8a87c', '#6ba3be']
    }]
  }

  pieChartInstance.setOption(option)
  window.addEventListener('resize', () => pieChartInstance && pieChartInstance.resize())
}

// ========== 快捷导航 ==========
const goTo = (path) => {
  router.push(path)
}

// ========== 辅助计算属性 ==========
const todayFoods = computed(() => {
  if (!foods.value.length) return { breakfast: [], lunch: [], dinner: [] }

  // 获取今天的日期，格式 YYYY/MM/DD（与 foods.json 中的 time 格式一致）
  const now = new Date()
  const todayStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

  // 优先匹配今天的数据
  let targetDate = todayStr
  const todayData = foods.value.filter(f => f.time === todayStr)

  // 如果今天没有数据，回退到最新日期
  if (todayData.length === 0) {
    const dates = [...new Set(foods.value.map(f => f.time))].sort((a, b) => {
      return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'))
    })
    targetDate = dates[0]
  }

  const filtered = foods.value.filter(f => f.time === targetDate)
  return {
    breakfast: filtered.filter(f => f.meal === '早餐'),
    lunch: filtered.filter(f => f.meal === '午餐'),
    dinner: filtered.filter(f => f.meal === '晚餐')
  }
})

const mealsDateLabel = computed(() => {
  if (!foods.value.length) return '今日三餐安排'

  const now = new Date()
  const todayStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

  const todayData = foods.value.filter(f => f.time === todayStr)
  if (todayData.length > 0) return '今日三餐安排'

  // 回退到最新日期时显示具体日期
  const dates = [...new Set(foods.value.map(f => f.time))].sort((a, b) => {
    return new Date(b.replace(/\//g, '-')) - new Date(a.replace(/\//g, '-'))
  })
  if (dates.length > 0) {
    const parts = dates[0].split('/')
    return `${parseInt(parts[1])}月${parseInt(parts[2])}日 三餐安排`
  }
  return '今日三餐安排'
})

const avgWorkerScore = computed(() => {
  if (!workers.value.length) return 0
  const sum = workers.value.reduce((acc, w) => acc + (w.score || 0), 0)
  return Math.round((sum / workers.value.length) * 10) / 10
})

// ========== 生命周期 ==========
onMounted(async () => {
  // 读取用户名
  const storedName = localStorage.getItem('user_name')
  if (storedName) userName.value = storedName

  updateGreetingAndDate()

  try {
    // 并行请求数据
    const [dashRes, workersRes] = await Promise.all([
      fetch('http://localhost:5000/api/dashboard'),
      fetch('http://localhost:5000/api/workers')
    ])

    const dashData = await dashRes.json()
    const workersData = await workersRes.json()

    foods.value = dashData.foods || []
    scoringList.value = dashData.scoringList || []
    users.value = dashData.users || []
    workers.value = workersData || []

    // 启动数字动画
    const mealTotal = todayFoods.value.breakfast.length +
                      todayFoods.value.lunch.length +
                      todayFoods.value.dinner.length

    animateNumber(animatedStats, 'elderCount', users.value.length)
    animateNumber(animatedStats, 'workerCount', workers.value.length)
    animateNumber(animatedStats, 'mealCount', mealTotal || foods.value.length)
    animateNumber(animatedStats, 'avgScore', avgWorkerScore.value)

    loading.value = false

    // 初始化图表
    nextTick(() => {
      initPieChart()
    })
  } catch (error) {
    console.error('数据加载失败:', error)
    loading.value = false
  }
})

onUnmounted(() => {
  if (streamInterval) clearInterval(streamInterval)
  if (pieChartInstance) {
    pieChartInstance.dispose()
    pieChartInstance = null
  }
})
</script>

<template>
  <div class="home-page">
    <!-- 1. 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-greeting">
          <span class="greeting-text">{{ greeting }}，</span>
          <span class="user-name">{{ userName }}</span>
        </div>
        <div class="welcome-date">{{ currentDate }}</div>
        <div class="welcome-tip">{{ tips }}</div>
      </div>
      <div class="welcome-decoration">🏠</div>
    </div>

    <!-- 2. 数据概览 -->
    <div class="stats-grid">
      <div v-if="loading" class="loading-placeholder">加载中...</div>
      <template v-else>
        <div class="stat-card">
          <div class="stat-icon-bg" style="background: rgba(91,140,110,0.12);">
            <span class="stat-icon">👴</span>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ Math.round(animatedStats.elderCount) }}</div>
            <div class="stat-label">老人总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-bg" style="background: rgba(107,163,190,0.12);">
            <span class="stat-icon">👨‍⚕️</span>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ Math.round(animatedStats.workerCount) }}</div>
            <div class="stat-label">护工总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-bg" style="background: rgba(232,168,124,0.15);">
            <span class="stat-icon">🍽️</span>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ Math.round(animatedStats.mealCount) }}</div>
            <div class="stat-label">今日餐次</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-bg" style="background: rgba(255,193,7,0.12);">
            <span class="stat-icon">⭐</span>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ animatedStats.avgScore.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 3. 今日三餐安排 -->
    <div class="glass-card meals-card">
      <div class="card-header">
        <h3 class="card-title">🍱 {{ mealsDateLabel }}</h3>
      </div>
      <div class="meals-container">
        <!-- 早餐 -->
        <div class="meal-column">
          <div class="meal-header">
            <span class="meal-emoji">🌅</span>
            <span class="meal-title">早餐</span>
          </div>
          <div class="meal-list">
            <div v-for="item in todayFoods.breakfast" :key="item.id" class="meal-item">
              <div class="meal-name">{{ item.name }}</div>
              <div class="meal-desc">{{ item.description }}</div>
              <span class="meal-tag" :class="item.greaseLevel">{{ item.grease }}</span>
            </div>
          </div>
        </div>

        <div class="meal-divider"></div>

        <!-- 午餐 -->
        <div class="meal-column">
          <div class="meal-header">
            <span class="meal-emoji">☀️</span>
            <span class="meal-title">午餐</span>
          </div>
          <div class="meal-list">
            <div v-for="item in todayFoods.lunch" :key="item.id" class="meal-item">
              <div class="meal-name">{{ item.name }}</div>
              <div class="meal-desc">{{ item.description }}</div>
              <span class="meal-tag" :class="item.greaseLevel">{{ item.grease }}</span>
            </div>
          </div>
        </div>

        <div class="meal-divider"></div>

        <!-- 晚餐 -->
        <div class="meal-column">
          <div class="meal-header">
            <span class="meal-emoji">🌙</span>
            <span class="meal-title">晚餐</span>
          </div>
          <div class="meal-list">
            <div v-for="item in todayFoods.dinner" :key="item.id" class="meal-item">
              <div class="meal-name">{{ item.name }}</div>
              <div class="meal-desc">{{ item.description }}</div>
              <span class="meal-tag" :class="item.greaseLevel">{{ item.grease }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 中间行：饼图 + 评分榜 -->
    <div class="middle-row">
      <!-- 左侧：行动能力分布 -->
      <div class="glass-card chart-card">
        <div class="card-header">
          <h3 class="card-title">🎂 老人行动能力分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>

      <!-- 右侧：护工评分榜 -->
      <div class="glass-card score-card">
        <div class="card-header">
          <h3 class="card-title">🌟 护工评分榜</h3>
          <span class="card-badge">本月数据</span>
        </div>
        <div class="score-list-container">
          <div class="score-list">
            <div v-for="(item, idx) in scoringList" :key="idx" class="score-item">
              <span class="score-rank">{{ item.flag }}</span>
              <div class="score-content">
                <div class="score-name">{{ item.text }}</div>
                <div class="score-comment">{{ item.score }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 快捷操作区域 -->
    <div class="quick-actions">
      <div class="quick-card" @click="goTo('/user')">
        <div class="quick-icon-bg" style="background: rgba(91,140,110,0.1);">
          <span class="quick-icon">👴</span>
        </div>
        <div class="quick-info">
          <div class="quick-title">查看老人信息</div>
          <div class="quick-desc">浏览和管理入住老人的详细档案</div>
        </div>
        <span class="quick-arrow">→</span>
      </div>
      <div class="quick-card" @click="goTo('/worker')">
        <div class="quick-icon-bg" style="background: rgba(107,163,190,0.1);">
          <span class="quick-icon">👨‍⚕️</span>
        </div>
        <div class="quick-info">
          <div class="quick-title">查看护工信息</div>
          <div class="quick-desc">了解护工团队及服务评价详情</div>
        </div>
        <span class="quick-arrow">→</span>
      </div>
      <div class="quick-card" @click="goTo('/dashboard')">
        <div class="quick-icon-bg" style="background: rgba(232,168,124,0.12);">
          <span class="quick-icon">📊</span>
        </div>
        <div class="quick-info">
          <div class="quick-title">进入数据大屏</div>
          <div class="quick-desc">实时监控养老院各项运营数据</div>
        </div>
        <span class="quick-arrow">→</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== 欢迎横幅 ========== */
.welcome-banner {
  position: relative;
  width: 100%;
  padding: 28px 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #fff8e1 50%, #fff3e0 100%);
  border: 1px solid rgba(91, 140, 110, 0.12);
  box-shadow: 0 4px 16px rgba(91, 140, 110, 0.08);
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content {
  z-index: 1;
}

.welcome-greeting {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.user-name {
  color: var(--primary);
}

.welcome-date {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.welcome-tip {
  font-size: 13px;
  color: var(--accent);
  font-style: italic;
}

.welcome-decoration {
  font-size: 64px;
  opacity: 0.15;
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;
}

/* ========== 数据概览卡片 ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(91, 140, 110, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(91, 140, 110, 0.12);
}

.stat-icon-bg {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 26px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.loading-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  font-size: 15px;
  color: var(--text-secondary);
}

/* ========== 三餐卡片 ========== */
.meals-card {
  grid-column: span 12;
}

.meals-container {
  display: flex;
  gap: 0;
  margin-top: 16px;
}

.meal-column {
  flex: 1;
  padding: 0 16px;
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px dashed rgba(91, 140, 110, 0.15);
}

.meal-emoji {
  font-size: 20px;
}

.meal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.meal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meal-item {
  background: rgba(245, 240, 235, 0.6);
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(91, 140, 110, 0.08);
  transition: all 0.25s ease;
}

.meal-item:hover {
  background: rgba(245, 240, 235, 0.9);
  transform: translateX(4px);
  border-color: rgba(91, 140, 110, 0.2);
}

.meal-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.meal-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
}

.meal-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.meal-tag.low {
  background: rgba(91, 140, 110, 0.12);
  color: var(--success);
}

.meal-tag.medium {
  background: rgba(232, 168, 124, 0.2);
  color: #c97a4a;
}

.meal-tag.high {
  background: rgba(224, 96, 96, 0.12);
  color: var(--danger);
}

.meal-divider {
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(91, 140, 110, 0.15), transparent);
  margin: 0 4px;
}

/* ========== 中间行 ========== */
.middle-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card,
.score-card {
  min-height: 320px;
}

.chart-container {
  width: 100%;
  height: 260px;
}

/* 评分榜 */
.score-list-container {
  margin-top: 10px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: rgba(245, 240, 235, 0.5);
  border-radius: 10px;
  border: 1px solid rgba(91, 140, 110, 0.08);
  transition: all 0.25s ease;
}

.score-item:hover {
  background: rgba(245, 240, 235, 0.85);
  transform: translateX(4px);
  border-color: rgba(91, 140, 110, 0.18);
}

.score-rank {
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.score-content {
  flex: 1;
}

.score-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.score-comment {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ========== 快捷操作 ========== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.quick-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 22px;
  border: 1px solid rgba(91, 140, 110, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(91, 140, 110, 0.12);
  border-color: rgba(91, 140, 110, 0.2);
}

.quick-icon-bg {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-icon {
  font-size: 24px;
}

.quick-info {
  flex: 1;
}

.quick-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.quick-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.quick-arrow {
  font-size: 18px;
  color: var(--secondary);
  opacity: 0.6;
  transition: all 0.3s;
}

.quick-card:hover .quick-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .middle-row {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .welcome-decoration {
    position: static;
    transform: none;
    font-size: 48px;
    opacity: 0.1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .meals-container {
    flex-direction: column;
  }

  .meal-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(91, 140, 110, 0.15), transparent);
    margin: 8px 0;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 220px;
  }
}
</style>
