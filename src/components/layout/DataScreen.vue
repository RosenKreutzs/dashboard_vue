<template>
  <div class="data-screen">
    <!-- 顶部数据卡片区 -->
    <div class="top-cards">
      <SalesCard title="销售总额" :value="totalSales" unit="万元" />
      <SalesCard title="同比增长" :value="growthRate" unit="%" />
      <SalesCard title="目标完成率" :value="targetRate" unit="%" />
      <SalesCard title="销售单量" :value="orderCount" unit="单" />
    </div>

    <!-- 中间图表区 -->
    <div class="middle-charts">
      <div class="chart-item">
        <SalesTrend :data="trendData" />
      </div>
      <div class="chart-item">
        <TargetProgress :data="progressData" />
      </div>
      <div class="chart-item">
        <DeptRanking :data="rankingData" />
      </div>
    </div>

    <!-- 底部数据区（简单示例） -->
    <div class="bottom-data">
      <div class="bottom-item">
        <h3 class="item-title">区域销售分布</h3>
        <div class="region-list">
          <div class="region-item">华东：42.5%</div>
          <div class="region-item">华南：28.3%</div>
          <div class="region-item">华北：18.7%</div>
          <div class="region-item">其他：10.5%</div>
        </div>
      </div>
      <div class="bottom-item">
        <h3 class="item-title">热销产品TOP3</h3>
        <div class="product-list">
          <div class="product-item">1. 产品A - 328万元</div>
          <div class="product-item">2. 产品B - 276万元</div>
          <div class="product-item">3. 产品C - 198万元</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 引入通用卡片组件
import SalesCard from '../common/SalesCard.vue';
// 引入图表组件（先占位，后续补充具体实现）
import SalesTrend from '../charts/SalesTrend.vue';
import TargetProgress from '../charts/TargetProgress.vue';
import DeptRanking from '../charts/DeptRanking.vue';

// 模拟核心数据（完整数据，解决[...]的问题）
const totalSales = ref(1284.3); // 销售总额
const growthRate = ref(23.5);   // 同比增长
const targetRate = ref(86.2);   // 目标完成率
const orderCount = ref(3284);   // 销售单量

// 销售趋势图数据（月份+销售额+同比）
const trendData = ref([
  { month: '1月', value: 85, yoy: 12.3 },
  { month: '2月', value: 98, yoy: 15.7 },
  { month: '3月', value: 112, yoy: 18.2 },
  { month: '4月', value: 105, yoy: 16.8 },
  { month: '5月', value: 130, yoy: 21.5 },
  { month: '6月', value: 145, yoy: 23.5 },
]);

// 目标完成情况数据
const progressData = ref([
  { name: 'Q1', target: 300, actual: 285, rate: 95 },
  { name: 'Q2', target: 350, actual: 320, rate: 91.4 },
  { name: 'Q3', target: 400, actual: 345, rate: 86.2 },
  { name: 'Q4', target: 450, actual: 0, rate: 0 }, // 未完成
]);

// 部门排名数据
const rankingData = ref([
  { dept: '销售一部', sales: 428, rank: 1 },
  { dept: '销售二部', sales: 365, rank: 2 },
  { dept: '销售三部', sales: 298, rank: 3 },
  { dept: '销售四部', sales: 193, rank: 4 },
]);
</script>

<style scoped>
/* 大屏整体样式 */
.data-screen {
  width: 100vw;
  height: 100vh;
  background: #0b1229; /* 深色科技风背景 */
  color: #ffffff;
  padding: 20px;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
}

/* 顶部卡片布局 */
.top-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  height: 120px;
}

/* 中间图表区布局 */
.middle-charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  height: 320px;
}

.chart-item {
  background: rgba(15, 25, 50, 0.8); /* 半透明卡片背景 */
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #1e3a8a; /* 边框点缀 */
}

/* 底部数据区布局 */
.bottom-data {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  height: calc(100vh - 120px - 320px - 60px);
}

.bottom-item {
  background: rgba(15, 25, 50, 0.8);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #1e3a8a;
}

.item-title {
  color: #00e4ff; /* 高亮标题色 */
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2f4587;
}

.region-list, .product-list {
  line-height: 2;
  color: #a0aec0;
}

.region-item, .product-item {
  padding: 4px 0;
}
</style>