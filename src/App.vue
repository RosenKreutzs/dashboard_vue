<template>
  <div class="dashboard-container">
    <!-- 大屏标题栏 -->
    <div class="dashboard-header">业务数据可视化大屏</div>

    <!-- 左侧数据卡片区域 -->
    <DataCard title="总访问量" value="1,258,963" desc="较昨日 +12.5%" />
    <DataCard title="新增用户" value="28,651" desc="较昨日 +8.2%" />
    <DataCard title="订单总量" value="9,872" desc="较昨日 -1.8%" />

    <!-- 中间图表区域（折线图+饼图） -->
    <div class="data-card" style="grid-row: 2 / 4;">
      <EchartsChart :option="lineChartOption" />
    </div>

    <!-- 右侧图表区域（饼图+柱状图） -->
    <div class="data-card">
      <EchartsChart :option="pieChartOption" />
    </div>
    <div class="data-card">
      <EchartsChart :option="barChartOption" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 导入封装的组件
import EchartsChart from './components/charts/EchartsChart.vue';
import DataCard from './components/common/DataCard.vue';

// 折线图静态配置（访问量趋势）
const lineChartOption = ref({
  title: { text: '近7日访问量趋势', textStyle: { color: '#fff' } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: '#94a3b8' } },
    axisLabel: { color: '#fff' }
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#94a3b8' } },
    axisLabel: { color: '#fff' }
  },
  series: [
    {
      name: '访问量',
      type: 'line',
      data: [152300, 168900, 145600, 189800, 201500, 215600, 198700],
      itemStyle: { color: '#38bdf8' },
      smooth: true
    }
  ]
});

// 饼图静态配置（用户来源分布）
const pieChartOption = ref({
  title: { text: '用户来源分布', textStyle: { color: '#fff' }, left: 'center' },
  tooltip: { trigger: 'item' },
  legend: {
    orient: 'vertical',
    top: 'middle',
    textStyle: { color: '#fff' }
  },
  series: [
    {
      name: '来源',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 4500, name: '微信' },
        { value: 3000, name: '抖音' },
        { value: 2000, name: '百度' },
        { value: 1500, name: '其他' }
      ],
      label: { color: '#fff' }
    }
  ]
});

// 柱状图静态配置（各渠道订单量）
const barChartOption = ref({
  title: { text: '各渠道订单量', textStyle: { color: '#fff' } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['微信', '抖音', '百度', '其他'],
    axisLine: { lineStyle: { color: '#94a3b8' } },
    axisLabel: { color: '#fff' }
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#94a3b8' } },
    axisLabel: { color: '#fff' }
  },
  series: [
    {
      name: '订单量',
      type: 'bar',
      data: [4200, 3500, 1800, 950],
      itemStyle: { color: '#10b981' }
    }
  ]
});
</script>

<style scoped>
/* 继承main.css的全局样式，无需重复编写 */
</style>