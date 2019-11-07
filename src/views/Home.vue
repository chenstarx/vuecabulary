<template>
    <div class="home">
        <Login v-if="showLogin" @close="showLogin=false" />
        <div class="header">两周搞定GRE单词</div>
        <img src="../assets/logo.svg" />
        <div class="start" @click="showLogin=true">开始学习</div>
        <div class="info" @click="goGit">© 2019-2020 chenstarx@GitHub<span>苏ICP备17067234号-3</span></div>
    </div>
</template>

<script>
import Login from '@/components/Login'

export default {
  name: 'home',
  components: {
    Login
  },
  mounted () {
    this.$event.on('login', this, () => { this.showLogin = true })
  },
  data () {
    return {
      showLogin: false
    }
  },
  methods: {
    goGit () {
      window.location.href = 'https://github.com/chenstarx/vue-vocabulary'
    }
  }
}
</script>

<style scoped>
.home {
  width: 100vw;
  height: 100vh;
  background: #F0F0F0;
}

.header {
  width: 100%;
  color: #40BC96;
  text-align: center;
  font-size: 40px;
  letter-spacing: 3px;
  font-weight: bold;
  padding-top: 150px;
  padding-bottom: 70px;
}

.start {
  width: 240px;
  height: 64px;
  margin: 80px auto;
  background: #40BC96;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  text-decoration: none;
  transition: all 0.5s ease;
  cursor: pointer;
}

.start:hover {
  background: rgb(40, 156, 121);
}

.info {
  position: absolute;
  bottom: 0;
  height: 80px;
  width: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  color: #999999;
  line-height: 30px;
  cursor: pointer;
}

.info span {
  font-size: 14px;
}
</style>
