<template>
  <div class="sales-card">
    <div class="card-title">{{ title }}</div>
    <div class="card-value">
      {{ value }}
      <span class="card-unit">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup>
// 定义组件属性
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.sales-card {
  background: rgba(15, 25, 50, 0.8);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #1e3a8a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.card-title {
  color: #a0aec0;
  font-size: 14px;
  margin-bottom: 8px;
}

.card-value {
  color: #00e4ff; /* 高亮数值色 */
  font-size: 24px;
  font-weight: bold;
}

.card-unit {
  font-size: 16px;
  color: #a0aec0;
  margin-left: 4px;
  font-weight: normal;
}
</style>