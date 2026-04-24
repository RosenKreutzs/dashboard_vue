<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLogin = ref(true)
const BASE_URL = 'http://localhost:5000/api' // 后端 API 基地址a

// 登录数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册数据
const registerForm = reactive({
  username: '',
  email: '',
  password: ''
})

// 1. 登录逻辑
const handleLogin = async () => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })

    const data = await response.json()
    if (response.ok) {
      // 存储 Token（假设后端返回字段叫 token）
      localStorage.setItem('user_token', data.token)
      localStorage.setItem('user_name', data.username)
      localStorage.setItem('user_id', data.authId) // 如果没返回ID，暂给个默认
      alert('系统准入成功，欢迎回来！')
      router.push('/') // 跳转至首页
    } else {
      alert(`认证失败: ${data.message || '凭据错误'}`)
    }
  } catch (error) {
    console.error('登录异常:', error)
    alert('连接安全核心服务器失败')
  }
}

// 2. 注册逻辑
const handleRegister = async () => {
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm)
    })

    const data = await response.json()

    if (response.ok) {
      alert('身份信息录入成功，请登录！')
      isLogin.value = true // 注册成功后切换到登录模式
    } else {
      alert(`登记失败: ${data.message || '信息不符合要求'}`)
    }
  } catch (error) {
    console.error('注册异常:', error)
    alert('无法将数据同步至 NeuralCore 服务端')
  }
}

const toggleMode = () => { isLogin.value = !isLogin.value }
</script>
<template>
  <div class="auth-page">
    <div class="bg-glow blue"></div>
    <div class="bg-glow purple"></div>

    <div class="auth-container">
      <div class="glass-card auth-card">
        <div class="auth-header">
          <h2 class="auth-title">
            {{ isLogin ? 'SYSTEM ACCESS' : 'CREATE ACCOUNT' }}
          </h2>
          <div class="auth-subtitle">
            {{ isLogin ? '请输入凭证进入智慧康养系统' : '完成信息登记以获取访问权限' }}
          </div>
        </div>

        <transition name="fade-slide" mode="out-in">
          <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form" key="login">
            <div class="input-group">
              <label>用户名 / USERNAME</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input v-model="loginForm.username" type="text" placeholder="Enter admin ID" required />
              </div>
            </div>

            <div class="input-group">
              <label>密码 / PASSWORD</label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input v-model="loginForm.password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <div class="auth-options">
              <label class="remember-me">
                <input type="checkbox" /> <span>记住设备</span>
              </label>
              <a href="#" class="forgot-link">忘记密码?</a>
            </div>

            <button type="submit" class="btn-auth login">
              <span class="btn-text">INITIALIZE LOGIN</span>
              <span class="btn-scan-line"></span>
            </button>
          </form>

          <form v-else @submit.prevent="handleRegister" class="auth-form" key="register">
            <div class="input-group">
              <label>用户名 / USERNAME</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input v-model="registerForm.username" type="text" placeholder="Desired username" required />
              </div>
            </div>

            <div class="input-group">
              <label>邮箱 / EMAIL</label>
              <div class="input-wrapper">
                <span class="input-icon">📧</span>
                <input v-model="registerForm.email" type="email" placeholder="official@system.com" required />
              </div>
            </div>

            <div class="input-group">
              <label>设置密码 / SET PASSWORD</label>
              <div class="input-wrapper">
                <span class="input-icon">🔑</span>
                <input v-model="registerForm.password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" class="btn-auth register">
              <span class="btn-text">CONFIRM REGISTRATION</span>
              <span class="btn-scan-line"></span>
            </button>
          </form>
        </transition>

        <div class="auth-footer">
          <p>{{ isLogin ? "还没有账号?" : "已经有账号了?" }}</p>
          <button @click="toggleMode" class="btn-toggle">
            {{ isLogin ? '立即注册 / REGISTER' : '返回登录 / BACK TO LOGIN' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面基础布局 */
.auth-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: var(--bg-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-primary);
}

/* 背景光晕模仿 Dashboard 的配色 */
.bg-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.3;
}
.blue { top: -100px; left: -100px; background: var(--secondary, #7ab68a); }
.purple { bottom: -100px; right: -100px; background: var(--accent, #e8a87c); }

/* 容器 */
.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

/* 玻璃卡片 */
.auth-card {
  padding: 40px;
  background: #ffffff;
  border: 1px solid rgba(91, 140, 110, 0.15);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

/* 头部样式 */
.auth-header {
  text-align: center;
  margin-bottom: 35px;
}

.auth-title {
  font-family: var(--font-heading);
  font-size: 26px;
  letter-spacing: 2px;
  color: var(--primary);
  margin-bottom: 10px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 输入框组 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group label {
  display: block;
  font-size: 11px;
  color: var(--primary);
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 1px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9f5;
  border: 1px solid rgba(91, 140, 110, 0.15);
  border-radius: 8px;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(91, 140, 110, 0.15);
}

.input-icon {
  padding-left: 15px;
  font-size: 16px;
  opacity: 0.7;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 15px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
}

.input-wrapper input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

/* 选项 */
.auth-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.forgot-link {
  color: var(--primary);
  text-decoration: none;
}

/* 按钮样式 - 对应你 UserView 的下载按钮风格 */
.btn-auth {
  position: relative;
  margin-top: 10px;
  padding: 14px;
  border-radius: 8px;
  border: none;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.btn-auth.login {
  background: linear-gradient(135deg, #5b8c6e, #4a7a5c);
  box-shadow: 0 5px 15px rgba(91, 140, 110, 0.25);
}

.btn-auth.register {
  background: linear-gradient(135deg, #7ab68a, #5b8c6e);
  box-shadow: 0 5px 15px rgba(91, 140, 110, 0.25);
}

.btn-auth:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* 扫描线动画 */
.btn-scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
  );
  animation: scan 2s infinite;
}

@keyframes scan {
  100% { left: 100%; }
}

/* 底部切换链接 */
.auth-footer {
  margin-top: 30px;
  text-align: center;
}

.auth-footer p {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.btn-toggle {
  background: none;
  border: none;
  color: var(--primary);
  font-family: var(--font-heading);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* 切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>