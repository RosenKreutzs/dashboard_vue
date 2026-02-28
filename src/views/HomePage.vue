<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'

// 1. 定义一个响应式变量来存储后端传来的数据
const serverData = ref(null)
const animatedStats = reactive({
  temperature:0,
  humidity:0,
  humidityChange:0,
  aqi:0,
  aqiChange:0,
  visibility:0,
  visibilityChange:0,
  pressure:0,
  pressureChange:0,
  averageTemperature:0,
})// 存储天气相关的数值，初始全为 0

const streamData = ref([])// 护工评分列表数据
const foods =ref([])
const trendChartRef = ref(null)// 用于绑定折线图 DOM 元素的引用
const pieChartRef = ref(null)// 用于绑定饼图 DOM 元素的引用
let streamInterval = null// 滚动定时器变量
let scanInterval = null// 扫描定时器变量

//纯 JS 实现的补间动画
const animateNumber = (target, key, endValue, duration = 2000) => {
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

// 折线图配置
const initTrendChart = (stats) => {
  if (!trendChartRef.value) return

  const chart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['最高温度', '最低温度'],
      textStyle: { color: '#00d4ff' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(255,255,255,0.6)' },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: '最高温度',
        type: 'line',
        smooth: true,
        data: stats.maximumTemperature,
        itemStyle: { color: '#00d4ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 212, 255, 0.5)' },
            { offset: 1, color: 'rgba(0, 212, 255, 0.1)' }
          ])
        }
      },
      {
        name: '最低温度',
        type: 'line',
        smooth: true,
        data: stats.minimumTemperature,
        itemStyle: { color: '#00ff9d' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 255, 157, 0.5)' },
            { offset: 1, color: 'rgba(0, 255, 157, 0.1)' }
          ])
        }
      }
    ]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}
// 饼图配置
const initPieChart = (users) => {
  if (!pieChartRef.value || !users) return

  const chart = echarts.init(pieChartRef.value)

  const actionCapabilitys = {}
  users.forEach(v => {
    actionCapabilitys[v.actionCapability] = (actionCapabilitys[v.actionCapability] || 0) + 1
  })

  const data = Object.entries(actionCapabilitys).map(([name, value]) => ({ name, value }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 个 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: '20%',
      textStyle: { color: '#00d4ff' }
    },
    series: [{
      type: 'pie',
      left: '10%',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#0a0e27',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{c}',
        color: '#fff',
        fontSize: 12
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        }
      },
      data: data,
      color: ['#00d4ff', '#00ff9d', '#ff3366', '#ffaa00']
    }]
  }

  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
}


//生命周期钩子:这是整个脚本的“引擎开关”。(页面加载完成时)
onMounted(async () => {
  try {
    // 调后端接口
    const response = await fetch('http://localhost:5000/api/dashboard')
    const data = await response.json()
    serverData.value = data // 保存数据
    streamData.value =data.scoringList
    foods.value = data.foods

    //启动数字动画: 延迟 500ms 后将真实统计数据通过 animateNumber 动态跑起来。
    setTimeout(() => {
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
    }, 500)

    //挂载图表: 使用 nextTick 确保 div 已经撑开，然后初始化 ECharts图。
    nextTick(() => {
      initTrendChart(data.stats)
      initPieChart(data.users)
    })
  } catch (error) {
  console.error("数据加载失败:", error)
  }
})
//页面销毁时:清理现场: 清除所有 setInterval 定时器。这是非常重要的习惯，如果不清除，当你切换到其他页面时，这些定时器还会跑，消耗 CPU 甚至引发报错。
onUnmounted(() => {
  if (streamInterval) clearInterval(streamInterval)
  if (scanInterval) clearInterval(scanInterval)
})
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-grid">
      <!-- 天气情况 -->
      <div class="glass-card overview-card">
        <div class="card-header">
          <h3 class="card-title">💡 天气情况</h3>
          <span class="card-badge">实时更新</span>
        </div>
        <div class="overview-stats">
          <div class="stat-item">
            <div class="stat-value">{{ animatedStats.temperature }} °C</div>
            <div class="stat-label">温度</div>
            <div class="stat-change">{{ animatedStats.averageTemperature }} 平均温度</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedStats.humidity }} %RH</div>
            <div class="stat-label">湿度</div>
            <div class="stat-change">{{ animatedStats.humidityChange }}% 湿度变化</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedStats.aqi }}</div>
            <div class="stat-label">空气质量指数</div>
            <div class="stat-change">{{ animatedStats.aqiChange }} 空气质量指数变化</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedStats.visibility }} m</div>
            <div class="stat-label">能见度</div>
            <div class="stat-change">{{ animatedStats.visibilityChange }}% 能见度变化</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ animatedStats.pressure }} Pa</div>
            <div class="stat-label">大气压强</div>
            <div class="stat-change">{{ animatedStats.pressureChange }}% 大气压强变化</div>
          </div>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="glass-card trend-card">
        <div class="card-header">
          <h3 class="card-title">📈 温度趋势</h3>
          <span class="card-badge">本周数据</span>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <!-- 饼图 -->
      <div class="glass-card pie-card">
        <div class="card-header">
          <h3 class="card-title">🎂 行动能力分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>


      <!-- 护工评分 -->
      <div class="glass-card stream-card">
        <div class="card-header">
          <h3 class="card-title">🌐 护工评分</h3>
          <span class="card-badge">本月数据</span>
        </div>

        <div class="stream-list-container">
          <div class="stream-track">
            <div v-for="(item, idx) in streamData" :key="'a' + idx" class="stream-item" :class="item.type">
              <span class="stream-flag">{{ item.flag }}</span>
              <div class="stream-content">
                <div class="stream-text">{{ item.text }}</div>
                <div class="stream-meta">{{ item.score }}</div>
              </div>
            </div>
            <div v-for="(item, idx) in streamData" :key="'b' + idx" class="stream-item" :class="item.type">
              <span class="stream-flag">{{ item.flag }}</span>
              <div class="stream-content">
                <div class="stream-text">{{ item.text }}</div>
                <div class="stream-meta">{{ item.score }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 三餐情况 -->
      <div class="glass-card poc-card">
        <div class="poc-grouped-container">
          <div class="poc-group">
            <div class="group-header">早餐</div>
            <div class="group-grid">
              <div v-for="vuln in foods?.filter(v => v.meal === '早餐').slice(0, 4)"
                   :key="vuln.id" class="poc-item" :class="vuln.greaseLevel">
                <div class="poc-name">{{ vuln.name }}</div>
                <div class="poc-type">{{ vuln.description }}</div>
                <span class="poc-risk" :class="vuln.greaseLevel">{{ vuln.grease }}</span>
              </div>
            </div>
          </div>

          <div class="group-divider"></div>

          <div class="poc-group">
            <div class="group-header">午餐</div>
            <div class="group-grid">
              <div v-for="vuln in foods?.filter(v => v.meal === '午餐').slice(0, 4)"
                   :key="vuln.id" class="poc-item" :class="vuln.greaseLevel">
                <div class="poc-name">{{ vuln.name }}</div>
                <div class="poc-type">{{ vuln.description }}</div>
                <span class="poc-risk" :class="vuln.greaseLevel">{{ vuln.grease }}</span>
              </div>
            </div>
          </div>

          <div class="group-divider"></div>

          <div class="poc-group">
            <div class="group-header">晚餐</div>
            <div class="group-grid">
              <div v-for="vuln in foods?.filter(v => v.meal === '晚餐').slice(0, 4)"
                   :key="vuln.id" class="poc-item" :class="vuln.greaseLevel">
                <div class="poc-name">{{ vuln.name }}</div>
                <div class="poc-type">{{ vuln.description }}</div>
                <span class="poc-risk" :class="vuln.greaseLevel">{{ vuln.grease }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层容器：裁剪掉超出部分 */
.stream-list-container {
  margin-top: 15px;
  height: 210px; /* 这里的固定高度要根据你的卡片大小调整 */
  overflow: hidden;
  position: relative;
}

/* 内部轨道：执行动画 */
.stream-track {
  display: flex;
  flex-direction: column;
  animation: scrollLoop 15s linear infinite; /* 15s 控制滚动速度 */
}

/* 鼠标悬停时暂停滚动，方便用户阅读 */
.stream-track:hover {
  animation-play-state: paused;
}

.stream-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 2px solid transparent;
  flex-shrink: 0; /* 防止内容被压缩 */
}

/* 关键帧：从 0 滚动到总高度的一半（因为我们复制了一份数据） */
@keyframes scrollLoop {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.dashboard {
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
}

.overview-card {
  grid-column: span 12;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
}

.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--secondary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.stat-change {
  font-size: 12px;
  color: var(--success);
  margin-top: 5px;
}

.pie-card {
  grid-column: span 4;
  min-height: 280px;
}

.bar-card {
  grid-column: span 4;
  min-height: 280px;
}

.heatmap-card {
  grid-column: span 4;
  min-height: 280px;
}

.trend-card {
  grid-column: span 4;
  min-height: 280px;
}

.chart-container {
  width: 100%;
  height: 200px;
}

.ai-pipeline-card {
  grid-column: span 6;
}

.code-window {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  margin: 15px 0;
}

.scan-code-window {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.2);
  margin: 15px 0;
  overflow: hidden;
}

.scan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 212, 255, 0.1);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.file-name {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--secondary);
}

.scan-status {
  font-size: 11px;
  color: var(--warning);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

.code-lines {
  padding: 8px 0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
}

.code-line-item {
  display: flex;
  align-items: center;
  padding: 3px 12px;
  transition: all 0.3s;
}

.code-line-item.pending {
  color: rgba(255, 255, 255, 0.5);
}

.code-line-item.scanning {
  color: var(--warning);
  background: rgba(255, 170, 0, 0.1);
}

.code-line-item.scanning .line-num {
  color: var(--warning);
}

.code-line-item.scanned {
  color: rgba(255, 255, 255, 0.7);
}

.code-line-item.scanned .line-num {
  color: rgba(255, 255, 255, 0.4);
}

.code-line-item.vulnerable {
  color: var(--danger);
}

.code-line-item.vulnerable .line-num {
  color: var(--danger);
}

.line-num {
  width: 28px;
  color: rgba(255, 255, 255, 0.3);
  text-align: right;
  padding-right: 12px;
  user-select: none;
}

.line-text {
  flex: 1;
}

.vuln-tag {
  margin-left: 8px;
  padding: 1px 6px;
  background: rgba(255, 51, 102, 0.2);
  color: var(--danger);
  border-radius: 4px;
  font-size: 9px;
  white-space: nowrap;
}

.code-line {
  padding: 4px 8px;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  transition: all 0.3s;
}

.code-line.highlight {
  background: rgba(0, 212, 255, 0.15);
  border-left: 2px solid var(--secondary);
}

.code-comment { color: #6a9955; }
.code-instr { color: #569cd6; }

.pipeline-flow, .exp-gen-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.pipeline-step, .gen-step {
  text-align: center;
  flex: 1;
}

.pipeline-icon, .gen-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 5px;
  font-size: 14px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  transition: all 0.3s;
}

.pipeline-step.active .pipeline-icon {
  background: rgba(0, 255, 157, 0.3);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(0, 255, 157, 0.3);
}

.gen-icon {
  background: rgba(255, 51, 102, 0.2);
  border-color: rgba(255, 51, 102, 0.3);
}

.pipeline-label, .gen-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.pipeline-arrow, .gen-arrow {
  color: var(--secondary);
  font-size: 14px;
}

.exp-gen-card {
  grid-column: span 6;
}

.gen-desc {
  margin-top: 15px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.gen-desc p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  line-height: 1.5;
}

.gen-desc p:last-child {
  margin-bottom: 0;
}

.map-card {
  grid-column: span 6;
  min-height: 280px;
}

.map-card-full {
  grid-column: span 12;
  min-height: 450px;
}

.map-split-container {
  display: flex;
  gap: 20px;
  height: 380px;
  margin-top: 15px;
}

.ranking-panel {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0;
}

.ranking-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 310px;
  overflow-y: auto;
  padding-right: 5px;
}

.ranking-list::-webkit-scrollbar {
  width: 4px;
}

.ranking-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.ranking-list::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.4);
  border-radius: 2px;
}

.ranking-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.6);
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  transition: all 0.3s;
}

.ranking-item:hover {
  background: rgba(0, 212, 255, 0.1);
}

.ranking-item.top3 {
  background: rgba(0, 212, 255, 0.15);
}

.rank-num {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.rank-num.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #000;
}

.rank-num.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #000;
}

.rank-num.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #000;
}

.rank-name {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.rank-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--secondary);
}

.map-container {
  flex: 1;
  height: 100%;
}

.poc-card {
  grid-column: span 12;
}

/* 分组容器：横向排列 */
.poc-grouped-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 20px;
  gap: 10px;
}

/* 单个分组 */
.poc-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 分组标题样式 */
.group-header {
  font-size: 18px;
  font-weight: bold;
  color: #5b7cff; /* 对应图中的蓝色 */
  margin-bottom: 5px;
  font-family: 'Orbitron', sans-serif;
  text-shadow: 0 0 10px rgba(91, 124, 255, 0.5);
}

/* 分组内的 2 列网格 */
.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  padding: 0 10px;
}

/* 虚线分割线 */
.group-divider {
  width: 1px;
  height: 200px; /* 根据实际卡片高度调整 */
  border-right: 2px dashed rgba(255, 255, 255, 0.3);
  margin: 40px 10px 0;
}

/* 修改原有的 poc-item 宽度适应分组 */
.poc-item {
  width: 100%;
  /* 保持你原有的 padding, background 等不变 */
}

.poc-item {
  padding: 12px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
}

.poc-item:hover {
  transform: translateY(-2px);
  border-color: var(--secondary);
}

.poc-item.high { border-left: 3px solid var(--danger); }
.poc-item.medium { border-left: 3px solid var(--warning); }
.poc-item.low { border-left: 3px solid var(--success); }

.poc-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}

.poc-type {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.poc-risk {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
}

.poc-risk.high { background: rgba(255, 51, 102, 0.2); color: var(--danger); }
.poc-risk.medium { background: rgba(255, 170, 0, 0.2); color: var(--warning); }
.poc-risk.low { background: rgba(0, 255, 157, 0.2); color: var(--success); }

.stream-card {
  grid-column: span 4;
  max-height: 280px;
  overflow: hidden;
}

.stream-list {
  margin-top: 15px;
  overflow-y: auto;
  max-height: 210px;
}

.stream-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 2px solid transparent;
  animation: slideIn 0.5s ease;
}

.stream-item.upload { border-left-color: var(--success); }
.stream-item.download { border-left-color: var(--secondary); }

.stream-flag {
  font-size: 16px;
  margin-right: 8px;
}

.stream-content {
  flex: 1;
}

.stream-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.stream-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

@media (max-width: 1400px) {
  .overview-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .poc-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .pie-card, .bar-card, .heatmap-card, .trend-card, .ai-pipeline-card, .exp-gen-card, .map-card, .stream-card {
    grid-column: span 6;
  }
}

@media (max-width: 1024px) {
  .poc-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .pie-card, .bar-card, .heatmap-card, .trend-card, .ai-pipeline-card, .exp-gen-card, .map-card, .stream-card, .poc-card {
    grid-column: span 12;
  }

  .map-split-container{
    flex-direction: column;
    height: 800px;
  }

  .ranking-panel {
    width: 100%;
    max-height: 350px;
    overflow: hidden;
  }

  .map-container {
    min-height: 400px;
  }
}
</style>
