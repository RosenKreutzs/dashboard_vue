<script setup>
import { RouterView, useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import { computed } from 'vue'

const route = useRoute()

// 判断当前页面是否需要隐藏布局（默认为 false）
const isHideLayout = computed(() => route.meta.hideLayout === true)
</script>

<template>
  <template v-if="isHideLayout">
    <RouterView />
  </template>

  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>

<style>
@import './style.css';
</style>