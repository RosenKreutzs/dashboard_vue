<template>
  <div ref="chartRef" class="target-progress-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
});

const chartRef = ref(null);
let myChart = null;

const initChart = () => {
  myChart = echarts.init(chartRef.value);
  const option = {
    title: { text: '月度目标完成情况', textStyle: { color: '#fff' } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.name),
      axisLine: { lineStyle: { color: '#2f4587' } },
      axisLabel: { color: '#a0aec0' }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额',
        position: 'left',
        axisLine: { lineStyle: { color: '#2f4587' } },
        axisLabel: { color: '#a0aec0' }
      },
      {
        type: 'value',
        name: '完成率(%)',
        position: 'right',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#2f4587' } },
        axisLabel: { color: '#a0aec0' }
      }
    ],
    series: [
      {
        name: '目标值',
        type: 'bar',
        data: props.data.map(item => item.target),
        itemStyle: { color: 'rgba(0, 228, 255, 0.3)' },
        barGap: 0
      },
      {
        name: '实际值',
        type: 'bar',
        data: props.data.map(item => item.actual),
        itemStyle: { color: '#00e4ff' }
      },
      {
        name: '完成率',
        type: 'line',
        data: props.data.map(item => item.rate),
        lineStyle: { color: '#ffd600' },
        yAxisIndex: 1
      }
    ],
    backgroundColor: 'transparent'
  };
  myChart.setOption(option);
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', () => myChart?.resize());
});

watch(() => props.data, () => {
  if (myChart) {
    myChart.setOption({
      xAxis: { data: props.data.map(item => item.name) },
      series: [
        { data: props.data.map(item => item.target) },
        { data: props.data.map(item => item.actual) },
        { data: props.data.map(item => item.rate) }
      ]
    });
  }
}, { deep: true });
</script>

<style scoped>
.target-progress-chart {
  width: 100%;
  height: 280px;
}
</style>