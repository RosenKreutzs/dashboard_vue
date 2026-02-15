<template>
  <!-- 部门排名图表容器 -->
  <div ref="chartRef" class="dept-ranking-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

// 定义接收的属性（适配 DataScreen 传入的 rankingData）
const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
});

const chartRef = ref(null);
let myChart = null;

// 初始化排名图表（横向柱状图更适合展示排名）
const initChart = () => {
  myChart = echarts.init(chartRef.value);

  const option = {
    title: {
      text: '部门销售排名',
      textStyle: { color: '#ffffff', fontSize: 16 },
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' } // 鼠标悬浮时的阴影指示器
    },
    // 倒序展示（排名1在最上方）
    grid: {
      left: '10%',
      right: '8%',
      top: '20%',
      bottom: '10%'
    },
    // Y 轴（部门名称）
    yAxis: {
      type: 'category',
      data: props.data.map(item => item.dept),
      axisLine: { lineStyle: { color: '#2f4587' } },
      axisLabel: { color: '#a0aec0', fontSize: 14 }
    },
    // X 轴（销售额）
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#2f4587' } },
      axisLabel: { color: '#a0aec0' },
      splitLine: { lineStyle: { color: 'rgba(47, 69, 135, 0.3)' } }
    },
    series: [
      {
        name: '销售额（万元）',
        type: 'bar', // 横向柱状图
        data: props.data.map(item => item.sales),
        // 排名不同的柱子用不同颜色区分
        itemStyle: {
          color: (params) => {
            const colors = ['#00e4ff', '#76e0ff', '#a8e6ff', '#d0ecff'];
            return colors[params.dataIndex] || '#00e4ff';
          }
        },
        // 在柱子上显示销售额数值
        label: {
          show: true,
          position: 'right', // 数值显示在柱子右侧
          color: '#ffffff',
          fontSize: 12
        },
        barWidth: '30%'
      }
    ],
    backgroundColor: 'transparent'
  };

  myChart.setOption(option);
};

onMounted(() => {
  if (chartRef.value) {
    initChart();
    window.addEventListener('resize', () => {
      if (myChart) myChart.resize();
    });
  }
});

// 监听数据变化更新图表
watch(
    () => props.data,
    () => {
      if (myChart) {
        myChart.setOption({
          yAxis: { data: props.data.map(item => item.dept) },
          series: [{ data: props.data.map(item => item.sales) }]
        });
      }
    },
    { deep: true }
);
</script>

<style scoped>
.dept-ranking-chart {
  width: 100%;
  height: 280px;
}
</style>