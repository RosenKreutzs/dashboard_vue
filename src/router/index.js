import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    // 假设你把上次给你的组件放在了 views/AuthView.vue
    component: () => import('../views/AuthView.vue'),
    meta: { title: '身份认证', hideLayout: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据大屏', hideLayout: true }
  },
  {
    path: '/',
    name: 'HomePage',
    component: () => import('../views/HomePage.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/UserView.vue'),
    meta: { title: '护工信息展示' }
  },
  {
    path: '/worker',
    name: 'Worker',
    component: () => import('../views/WorkerView.vue'),
    meta: { title: '老人信息展示' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：拦截未登录请求
router.beforeEach((to, from, next) => {
  // 设置标题
  document.title = `${to.meta.title || '智慧康养'} - NeuralCore`

  // 检查本地是否有 Token
  const isAuthenticated = localStorage.getItem('user_token')

  // 如果访问非登录页且未登录，跳转到登录
  if (to.name !== 'Login' && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    // 如果已登录还想去登录页，直接送去仪表盘
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router