<template>
    <div class="background">
        <div class="login">
            <div class="login-title">
                <span>登录/注册</span>
                <img @click="close" src="../assets/close.png" />
            </div>
            <div class="login-main">
                <input v-model="username" placeholder="请输入用户名" spellcheck="false" type="text" />
                <div class="login-line" />
                <span>用户名</span>
                <input v-model="password" placeholder="请输入密码" type="password" />
                <div class="login-line" />
                <span>密码</span>
                <div class="login-button" @click="login">登录</div>
                <div class="login-hint">未注册用户将会自动注册为新用户</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Login',
  data () {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    close () {
      this.$emit('close')
    },
    login () {
      const username = this.username
      const password = this.password
      if (!username) return alert('请填写用户名')
      if (!password) return alert('请填写密码')
      if (username.length < 4) return alert('用户名至少需要4位')
      if (password.length < 5) return alert('密码至少需要5位')
      const user = {
        username,
        password,
        createdAt: Date.now()
      }
      console.log(user)
    }
  }
}
</script>

<style scoped>
.background {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgb(0, 0, 0, 0.5);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.login {
  width: 600px;
  height: fit-content;
}

.login-title {
  width: 100%;
  background: #40BC96;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 35px;
  box-sizing: border-box;
}

.login-title span {
  font-size: 30px;
  color: #FFFFFF;
  font-weight: 700;
}

.login-title img {
  height: 38px;
  width: 38px;
  cursor: pointer;
}

.login-main {
  width: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  padding: 35px 35px 25px 35px;
  box-sizing: border-box;
}

.login-main input {
  width: 100%;
  height: 32px;
  border: none;
  box-shadow: none;
  outline: none;
  font-size: 18px;
}

.login-main input::-webkit-input-placeholder{
  color: #C1CACE;
}

.login-main span {
  width: 100%;
  color: #97a5aa;
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 25px;
  text-align: left;
}

.login-line {
  width: 100%;
  height: 3px;
  background: #455358;
  margin-top: 2px;
  margin-bottom: 6px;
}

.login-button {
  width: 100%;
  height: 70px;
  background: #3CCFCF;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.5s ease;
}

.login-button:hover {
  background: #F9CC28;
  color: #455358;
}

.login-hint {
  color: #455358;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 400;
  text-align: left;
}
</style>
