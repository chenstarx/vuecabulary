<template>
    <div class="home">
        <Login v-if="showLogin" @close="showLogin=false" />
        <template v-if="user._id">
            <div class="main">
                <div class="revise">
                    <div class="revise-left">
                        <div class="revise-num">
                            {{reviseNum}}
                            <span>待复习</span>
                        </div>
                    </div>
                    <div class="revise-right">
                        <div class="revise-title">GRE高频325分机经词</div>
                        <div class="revise-hint">早晚各复习一次，短时间就可以背下来！</div>
                        <div class="revise-button">开始复习</div>
                    </div>
                </div>
                <div class="hint">新学单词：</div>
                <div class="learn">
                    <div class="learn-list">
                        <div class="list-title">Day 1：新学List1~3</div>
                        <div class="list-hint">300个单词</div>
                        <div class="list-more">尚未开始，花费约3小时</div>
                        <div class="list-hover"></div>
                    </div>
                    <div class="learn-list">
                        <div class="list-title">Day 2：新学List4~6</div>
                        <div class="list-hint">300个单词</div>
                        <div class="list-more">尚未开始，花费约3小时</div>
                        <div class="list-hover"></div>
                    </div>
                    <div class="learn-list">
                        <div class="list-title">Day 3：新学List7~9</div>
                        <div class="list-hint">300个单词</div>
                        <div class="list-more">尚未开始，花费约3小时</div>
                        <div class="list-hover"></div>
                    </div>
                    <div class="learn-list">
                        <div class="list-title">Day 4：新学List10~12</div>
                        <div class="list-hint">300个单词</div>
                        <div class="list-more">尚未开始，花费约3小时</div>
                        <div class="list-hover"></div>
                    </div>
                    <div class="learn-list">
                        <div class="list-title">Day 5：新学List13~15</div>
                        <div class="list-hint">300个单词</div>
                        <div class="list-more">尚未开始，花费约3小时</div>
                        <div class="list-hover"></div>
                    </div>
                    <div class="learn-list">
                        <div class="list-title">Day 6：新学List16~18</div>
                        <div class="list-hint">220个单词</div>
                        <div class="list-more">尚未开始，花费约2小时</div>
                        <div class="list-hover"></div>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="header">两周搞定GRE单词</div>
            <img src="../static/icons/logo.svg" />
            <div class="start" @click="showLogin=true">现在开始</div>
        </template>
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
      showLogin: false,
      reviseNum: 256
    }
  },
  computed: {
    user () {
      return this.$store.state.user
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
  overflow: hidden;
}

.main {
  height: 100%;
  padding: 110px 30px 0 30px;
  box-sizing: border-box;
  max-width: 1000px;
  margin: 0 auto;
}

.revise {
  width: 100%;
  background: #FFFFFF;
  box-shadow: 0 2px 7px 0 rgba(0, 0, 0, .24);
  border-radius: 4px;
  padding: 35px;
  box-sizing: border-box;
  display: flex;
}

.revise-left {
  width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.revise-num {
  width: 115px;
  height: 115px;
  border-radius: 50%;
  border: 9px solid #C1CACE;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 25px;
  color: #40BC96;
  font-weight: 600;
  border: 8px solid #C1CACE;
}

.revise-num span {
  margin-top: 6px;
  font-size: 15px;
  color: #455358;
  font-weight: 700;
}

.revise-right {
  width: calc(100% - 140px);
  height: 100%;
  padding-left: 35px;
  box-sizing: border-box;
}

.revise-title {
  width: 100%;
  font-size: 36px;
  font-weight: 700;
  color: #455358;
  text-align: left;
}

.revise-hint {
  width: 100%;
  color: #455358;
  font-size: 17px;
  margin-top: 15px;
  text-align: left;
}

.revise-button {
  width: 220px;
  height: 64px;
  margin-top: 30px;
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

.revise-button:hover {
  background: #F9CC28;
  color: #455358;
}

.hint {
  width: 100%;
  font-weight: 600;
  font-size: 18px;
  color: #455358;
  margin-top: 30px;
  text-align: left;
}

.learn {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 15px;
}

.learn-list {
  width: 32%;
  border-radius: 5px;
  box-shadow: 0 0 1.5px 0 rgba(0,0,0,.24);
  background: #FFFFFF;
  padding: 20px 0 20px 20px;
  box-sizing: border-box;
  margin-bottom: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.list-hover {
  width: 100%;
  height: 5px;
  background: #F9CC28;
  opacity: 0;
  transition: all 0.4s;
  position: absolute;
  bottom: 0;
  left: 0;
}

.learn-list:hover .list-hover {
  opacity: 1;
}

.list-title {
  width: 100%;
  font-size: 21px;
  font-weight: 700;
  color: #455358;
  text-align: left;
}

.list-hint {
  width: 100%;
  color: #99A5AA;
  font-size: 14px;
  margin-top: 8px;
  text-align: left;
  font-weight: 700;
}

.list-more {
  width: 100%;
  color: #455358;
  font-size: 13px;
  margin-top: 35px;
  text-align: left;
  font-weight: 600;
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
