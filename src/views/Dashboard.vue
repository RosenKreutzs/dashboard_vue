<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import 'echarts-gl'

const router = useRouter()
const serverData = ref(null)
const loading = ref(true)
const animatedStats = reactive({
  temperature: 0,
  humidity: 0,
  humidityChange: 0,
  aqi: 0,
  aqiChange: 0,
  visibility: 0,
  visibilityChange: 0,
  pressure: 0,
  pressureChange: 0,
  averageTemperature: 0,
})

const streamData = ref([])
const foods = ref([])
const trendChartRef = ref(null)
const pieChartRef = ref(null)
let streamInterval = null
let scanInterval = null

const currentTime = ref('')
const updateTime = () => {
  const now = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  currentTime.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}
let timeInterval = null

const weatherIcons = [
  { icon: '🌡️', label: '温度', unit: '°C', key: 'temperature', sub: 'averageTemperature', subLabel: '平均温度' },
  { icon: '💧', label: '湿度', unit: '%RH', key: 'humidity', sub: 'humidityChange', subLabel: '湿度变化' },
  { icon: '🌫️', label: '空气质量', unit: '', key: 'aqi', sub: 'aqiChange', subLabel: 'AQI变化' },
  { icon: '👁️', label: '能见度', unit: 'm', key: 'visibility', sub: 'visibilityChange', subLabel: '能见度变化' },
  { icon: '📊', label: '气压', unit: 'Pa', key: 'pressure', sub: 'pressureChange', subLabel: '气压变化' }
]

const greaseConfig = {
  low: { dot: '🟢', text: '清淡', color: 'var(--success)' },
  medium: { dot: '🟡', text: '适中', color: 'var(--warning)' },
  high: { dot: '🔴', text: '重油', color: 'var(--danger)' }
}

const mealConfig = {
  '早餐': { icon: '🌅', color: '#e8a87c' },
  '午餐': { icon: '☀️', color: '#5b8c6e' },
  '晚餐': { icon: '🌙', color: '#6ba3be' }
}

const animateNumber = (target, key, endValue, duration = 800) => {
  const startTime = Date.now()
  const startValue = target[key]
  const diff = endValue - startValue

  const update = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    target[key] = Math.floor(startValue + diff * easeProgress)

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  requestAnimationFrame(update)
}

const initTrendChart = (stats) => {
  if (!trendChartRef.value) return

  const chart = echarts.init(trendChartRef.value)

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const dataLen = stats.maximumTemperature?.length || 7

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['最高温度', '最低温度'],
      textStyle: { color: '#6b6b6b' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: weekDays.slice(0, dataLen),
      axisLabel: { color: '#8c8c8c' },
      axisLine: { lineStyle: { color: 'rgba(91, 140, 110, 0.3)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8c8c8c' },
      axisLine: { lineStyle: { color: 'rgba(91, 140, 110, 0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(91, 140, 110, 0.1)' } }
    },
    series: [
      {
        name: '最高温度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: stats.maximumTemperature,
        itemStyle: { color: '#5b8c6e' },
        lineStyle: { width: 3, color: '#5b8c6e' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(91, 140, 110, 0.4)' },
            { offset: 1, color: 'rgba(91, 140, 110, 0.05)' }
          ])
        }
      },
      {
        name: '最低温度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: stats.minimumTemperature,
        itemStyle: { color: '#e8a87c' },
        lineStyle: { width: 3, color: '#e8a87c' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(232, 168, 124, 0.4)' },
            { offset: 1, color: 'rgba(232, 168, 124, 0.05)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

const initPieChart = (users) => {
  if (!pieChartRef.value || !users) return

  const chart = echarts.init(pieChartRef.value)

  const actionCapabilitys = {}
  users.forEach(v => {
    actionCapabilitys[v.actionCapability] = (actionCapabilitys[v.actionCapability] || 0) + 1
  })

  const data = Object.entries(actionCapabilitys).map(([name, value]) => ({ name, value }))
  const total = users.length

  const option = {
    color: ['#5b8c6e', '#7ab68a', '#e8a87c', '#6ba3be'],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 位 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: '20%',
      textStyle: { color: '#6b6b6b' }
    },
    graphic: [
      {
        type: 'text',
        left: '39%',
        top: '45%',
        style: {
          text: `${total}`,
          textAlign: 'center',
          fill: '#3d3d3d',
          fontSize: 24,
          fontWeight: 'bold'
        }
      },
      {
        type: 'text',
        left: '39%',
        top: '55%',
        style: {
          text: '总人数',
          textAlign: 'center',
          fill: '#8c8c8c',
          fontSize: 12
        }
      }
    ],
    series: [{
      type: 'pie',
      radius: ['40%', '62%'],
      center: ['42%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{c}',
        color: '#6b6b6b',
        fontSize: 12
      },
      labelLine: {
        lineStyle: {
          color: 'rgba(91, 140, 110, 0.3)'
        }
      },
      emphasis: {
        scale: true,
        scaleSize: 10,
        itemStyle: {
          shadowBlur: 20,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#3d3d3d'
        }
      },
      data: data
    }]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}

onMounted(async () => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  try {
    const response = await fetch('http://localhost:5000/api/dashboard')
    const data = await response.json()
    serverData.value = data
    streamData.value = data.scoringList
    foods.value = data.foods

    animateNumber(animatedStats, 'temperature', data.stats.temperature)
    animateNumber(animatedStats, 'averageTemperature', data.stats.averageTemperature)
    animateNumber(animatedStats, 'humidity', data.stats.humidity)
    animateNumber(animatedStats, 'humidityChange', data.stats.humidityChange)
    animateNumber(animatedStats, 'aqi', data.stats.aqi)
    animateNumber(animatedStats, 'aqiChange', data.stats.aqiChange)
    animateNumber(animatedStats, 'visibility', data.stats.visibility)
    animateNumber(animatedStats, 'visibilityChange', data.stats.visibilityChange)
    animateNumber(animatedStats, 'pressure', data.stats.pressure)
    animateNumber(animatedStats, 'pressureChange', data.stats.pressureChange)

    loading.value = false

    nextTick(() => {
      initTrendChart(data.stats)
      initPieChart(data.users)
    })
  } catch (error) {
    console.error("数据加载失败:", error)
    loading.value = false
  }
})

onUnmounted(() => {
  if (streamInterval) clearInterval(streamInterval)
  if (scanInterval) clearInterval(scanInterval)
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<template>
  <div class="dashboard">
    <!-- 页面顶部标题栏 -->
    <div class="page-header-bar">
      <div class="header-left">
        <h1 class="header-title">顺风颐养 · 数据总览</h1>
        <p class="header-time">{{ currentTime }}</p>
      </div>
      <button class="header-back-btn" @click="router.push('/')">
        <span>←</span> 返回首页
      </button>
    </div>

    <div class="dashboard-grid">
      <!-- 天气情况 -->
      <div class="glass-card overview-card">
        <div class="card-header">
          <h3 class="card-title">🌤️ 天气情况</h3>
          <span class="card-badge">实时更新</span>
        </div>
        <div class="overview-stats">
          <div v-if="loading" class="loading-placeholder">加载中...</div>
          <template v-else>
            <div v-for="(item, index) in weatherIcons" :key="item.key" class="stat-item">
              <div class="stat-icon">{{ item.icon }}</div>
              <div class="stat-value">{{ animatedStats[item.key] }}{{ item.unit }}</div>
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-change">{{ animatedStats[item.sub] }}{{ item.sub === 'averageTemperature' ? '°C' : '%' }} {{ item.subLabel }}</div>
              <div v-if="index < weatherIcons.length - 1" class="stat-divider"></div>
            </div>
          </template>
        </div>
      </div>

      <!-- 温度趋势图 -->
      <div class="glass-card trend-card">
        <div class="card-header">
          <h3 class="card-title">📈 本周气温变化</h3>
          <span class="card-badge">本周数据</span>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <!-- 行动能力分布 -->
      <div class="glass-card pie-card">
        <div class="card-header">
          <h3 class="card-title">🎂 老人行动能力概况</h3>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>

      <!-- 优秀护工榜 -->
      <div class="glass-card stream-card">
        <div class="card-header">
          <h3 class="card-title">🏆 优秀护工榜</h3>
          <span class="card-badge">本月数据</span>
        </div>

        <div class="stream-list-container">
          <div class="stream-track">
            <div v-for="(item, idx) in streamData" :key="'a' + idx" class="stream-item" :class="item.type">
              <div class="stream-rank" :class="{ 'rank-gold': idx === 0, 'rank-silver': idx === 1, 'rank-bronze': idx === 2 }">
                {{ idx + 1 }}
              </div>
              <div class="stream-content">
                <div class="stream-text">{{ item.text }}</div>
                <div class="stream-meta">{{ item.score }}</div>
              </div>
            </div>
            <div v-for="(item, idx) in streamData" :key="'b' + idx" class="stream-item" :class="item.type">
              <div class="stream-rank" :class="{ 'rank-gold': idx === 0, 'rank-silver': idx === 1, 'rank-bronze': idx === 2 }">
                {{ idx + 1 }}
              </div>
              <div class="stream-content">
                <div class="stream-text">{{ item.text }}</div>
                <div class="stream-meta">{{ item.score }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日膳食安排 -->
      <div class="glass-card poc-card">
        <div class="card-header">
          <h3 class="card-title">🍽️ 今日膳食安排</h3>
        </div>
        <div class="poc-grouped-container">
          <div v-for="meal in ['早餐', '午餐', '晚餐']" :key="meal" class="poc-group">
            <div class="group-header">
              <span class="meal-icon">{{ mealConfig[meal].icon }}</span>
              {{ meal }}
            </div>
            <div class="group-grid">
              <div v-for="vuln in foods?.filter(v => v.meal === meal).slice(0, 4)"
                   :key="vuln.id" class="poc-item" :class="vuln.greaseLevel">
                <div class="poc-name">{{ vuln.name }}</div>
                <div class="poc-type">{{ vuln.description }}</div>
                <span class="poc-risk" :class="vuln.greaseLevel">
                  <span class="risk-dot" :style="{ backgroundColor: greaseConfig[vuln.greaseLevel]?.color || 'var(--text-secondary)' }"></span>
                  {{ greaseConfig[vuln.greaseLevel]?.text || vuln.grease }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  padding-bottom: 24px;
}

/* 页面顶部标题栏 */
.page-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(91, 140, 110, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.page-header-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
  border-radius: 16px 16px 0 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.header-time {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.header-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: linear-gradient(135deg, var(--primary), #4a7a5c);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.header-back-btn:hover {
  box-shadow: 0 4px 12px rgba(91, 140, 110, 0.3);
  transform: translateY(-2px);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.glass-card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid rgba(91, 140, 110, 0.15);
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s, transform 0.3s;
}

.glass-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--secondary), transparent);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 600;
  color: var(--primary);
}

.card-badge {
  padding: 4px 12px;
  background: rgba(91, 140, 110, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: var(--primary);
}

/* 天气卡片 */
.overview-card {
  grid-column: span 12;
  background: linear-gradient(135deg, rgba(91, 140, 110, 0.08) 0%, rgba(232, 168, 124, 0.08) 100%);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  margin-top: 20px;
}

.stat-item {
  position: relative;
  text-align: center;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  margin: 0 8px;
  transition: all 0.3s;
  backdrop-filter: blur(4px);
}

.stat-item:first-child {
  margin-left: 0;
}

.stat-item:last-child {
  margin-right: 0;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(91, 140, 110, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 10px;
  font-weight: 500;
}

.stat-change {
  font-size: 12px;
  color: var(--success);
  margin-top: 6px;
  font-weight: 500;
}

.stat-divider {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 60%;
  background: rgba(91, 140, 110, 0.15);
}

.loading-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  font-size: 15px;
  color: var(--text-secondary);
}

/* 图表卡片 */
.trend-card {
  grid-column: span 4;
  min-height: 340px;
}

.pie-card {
  grid-column: span 4;
  min-height: 340px;
}

.chart-container {
  width: 100%;
  height: 250px;
}

/* 护工榜 */
.stream-card {
  grid-column: span 4;
  max-height: 340px;
  overflow: hidden;
}

.stream-list-container {
  margin-top: 15px;
  height: 250px;
  overflow: hidden;
  position: relative;
}

.stream-track {
  display: flex;
  flex-direction: column;
  animation: scrollLoop 20s linear infinite;
}

.stream-track:hover {
  animation-play-state: paused;
}

@keyframes scrollLoop {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.stream-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(91, 140, 110, 0.05);
  border-radius: 10px;
  margin-bottom: 8px;
  border-left: 3px solid transparent;
  flex-shrink: 0;
  transition: all 0.3s;
}

.stream-item:hover {
  background: rgba(91, 140, 110, 0.1);
  transform: translateX(4px);
}

.stream-item.upload { border-left-color: var(--success); }
.stream-item.download { border-left-color: var(--secondary); }

.stream-rank {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  margin-right: 8px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.stream-rank.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 170, 0, 0.3);
}

.stream-rank.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #fff;
  box-shadow: 0 2px 8px rgba(160, 160, 160, 0.3);
}

.stream-rank.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
  box-shadow: 0 2px 8px rgba(184, 115, 51, 0.3);
}

.stream-flag {
  font-size: 16px;
  margin-right: 8px;
}

.stream-content {
  flex: 1;
  min-width: 0;
}

.stream-text {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.stream-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 三餐卡片 */
.poc-card {
  grid-column: span 12;
}

.poc-grouped-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 20px;
  gap: 24px;
}

.poc-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  border: 1px solid rgba(91, 140, 110, 0.1);
}

.group-header {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meal-icon {
  font-size: 20px;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.poc-item {
  padding: 14px 12px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(91, 140, 110, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
  border-left: 4px solid transparent;
}

.poc-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: rgba(91, 140, 110, 0.2);
}

.poc-item.high { border-left-color: var(--danger); }
.poc-item.medium { border-left-color: var(--warning); }
.poc-item.low { border-left-color: var(--success); }

.poc-name {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.poc-type {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  line-height: 1.6;
}

.poc-risk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(91, 140, 110, 0.08);
  color: var(--text-secondary);
}

.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.poc-risk.high { background: rgba(224, 96, 96, 0.1); color: var(--danger); }
.poc-risk.medium { background: rgba(232, 168, 124, 0.1); color: var(--warning); }
.poc-risk.low { background: rgba(91, 140, 110, 0.1); color: var(--success); }

@media (max-width: 1400px) {
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-item {
    margin: 0;
  }

  .stat-divider {
    display: none;
  }

  .poc-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .pie-card, .trend-card, .stream-card {
    grid-column: span 6;
  }
}

@media (max-width: 1024px) {
  .overview-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .pie-card, .trend-card, .stream-card, .poc-card {
    grid-column: span 12;
  }

  .poc-grouped-container {
    flex-direction: column;
    gap: 16px;
  }

  .group-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
