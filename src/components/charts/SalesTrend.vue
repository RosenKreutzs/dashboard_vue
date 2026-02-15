<template>
  <!-- ECharts 图表容器，通过 ref 绑定 DOM 元素 -->
  <div ref="chartRef" class="sales-trend-chart"></div>
</template>

<script setup>
// 引入 Vue 核心 API 和 ECharts
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

// 定义组件接收的属性（适配 DataScreen 传入的 trendData）
const props = defineProps({
  data: {
    type: Array,
    required: true, // 必须传入数据
    default: () => []
  }
});

// 图表容器的 DOM 引用
const chartRef = ref(null);
// 存储 ECharts 实例
let myChart = null;

// 初始化图表的核心函数
const initChart = () => {
  // 初始化 ECharts 实例
  myChart = echarts.init(chartRef.value);

  // 配置图表选项（深色科技风样式）
  const option = {
    // 图表标题
    title: {
      text: '销售趋势（月度）',
      textStyle: { color: '#ffffff', fontSize: 16 },
      left: 'center'
    },
    // 鼠标悬浮提示框
    tooltip: {
      trigger: 'axis',
      textStyle: { color: '#000' }
    },
    // 图例
    legend: {
      data: ['销售额', '同比增长'],
      textStyle: { color: '#a0aec0' }
    },
    // X 轴（月份）
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.month), // 从传入数据中提取月份
      axisLine: { lineStyle: { color: '#2f4587' } }, // 轴线颜色
      axisLabel: { color: '#a0aec0' } // 轴标签颜色
    },
    // Y 轴（数值）
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2f4587' } },
      axisLabel: { color: '#a0aec0' },
      splitLine: { lineStyle: { color: 'rgba(47, 69, 135, 0.3)' } } // 网格线半透明
    },
    // 系列数据（柱状图+折线图）
    series: [
      {
        name: '销售额',
        type: 'bar', // 柱状图
        data: props.data.map(item => item.value), // 销售额数值
        itemStyle: { color: '#00e4ff' }, // 主色调（青蓝色）
        barWidth: '40%' // 柱子宽度
      },
      {
        name: '同比增长',
        type: 'line', // 折线图
        data: props.data.map(item => item.yoy), // 同比增长率
        lineStyle: { color: '#ffd600', width: 2 }, // 辅助色（黄色）
        symbol: 'circle', // 拐点样式
        symbolSize: 6 // 拐点大小
      }
    ],
    backgroundColor: 'transparent' // 透明背景，适配父容器深色
  };

  // 应用配置项到图表
  myChart.setOption(option);
};

// 组件挂载后初始化图表
onMounted(() => {
  if (chartRef.value) {
    initChart();
    // 监听窗口大小变化，自动调整图表尺寸
    window.addEventListener('resize', () => {
      if (myChart) myChart.resize();
    });
  }
});

// 监听传入的 data 变化，实时更新图表
watch(
    () => props.data,
    () => {
      if (myChart) {
        myChart.setOption({
          xAxis: { data: props.data.map(item => item.month) },
          series: [
            { data: props.data.map(item => item.value) },
            { data: props.data.map(item => item.yoy) }
          ]
        });
      }
    },
    { deep: true } // 深度监听数组内数据变化
);
</script>

<style scoped>
/* 图表容器样式，适配父布局 */
.sales-trend-chart {
  width: 100%;
  height: 280px; /* 和 DataScreen 中的图表容器高度匹配 */
}
</style>