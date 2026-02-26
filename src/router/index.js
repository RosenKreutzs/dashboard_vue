import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据大屏' ,hideLayout: true}
  },
  {
    path: '/',
    name: 'HomePage',
    component: () => import('../views/HomePage.vue'),
    meta: { title: '数据大屏' }
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
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: () => import('../views/VulnDetail.vue'),
    meta: { title: '详情' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'CPU漏洞检测平台'} - NeuralCore`
  next()
})

export default router
