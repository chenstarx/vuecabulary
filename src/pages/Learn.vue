<template>
    <div class="learn">
        <div class="main">
            <div class="main-left">
                <div class="left-back" @click="goBack">
                    <img src="../static/icons/back.png" />
                    后退
                </div>
                <div class="left-main">
                    <div class="left-title">
                        <img src="../static/icons/memory.png" />
                        学习模式
                    </div>
                    <div class="left-counter">
                        <div class="left-number" style="color:#AAAAAA">{{wordLeft}}</div>
                        <span>剩余</span>
                        <img src="../static/icons/next.png" />
                        <div class="left-number" style="color:#EACD76">{{wordReview}}</div>
                        <span>需巩固</span>
                        <img src="../static/icons/next.png" />
                        <div class="left-number" style="color:#23B26D">{{wordFinished}}</div>
                        <span>已完成</span>
                    </div>
                    <div class="left-rate">{{progress}}%</div>
                </div>
            </div>
            <div class="learn-word">
                <div class="word-card" @click="cardClicked">
                    <div class="card-progress">
                        <div :style="'width:'+unitProgress+'%'" />
                    </div>
                    <div class="word-en"><div/><span>{{wordEn}}</span></div>
                    <div class="word-zh" :style="showZh?'':'opacity:0'">{{wordZh}}</div>
                </div>
                <div class="word-choice">
                    <template v-if="wordType==='new'">
                      <div
                        class="button new"
                        @click="learnCurrentWord"
                        :style="showZh?'':'border:solid 2px #c0cace;color:#c0cace;'"
                      >
                          <div class="button-num"><span>1</span></div>
                          知道啦，学习下一个
                      </div>
                    </template>
                    <template v-if="wordType==='learned'">
                        <div
                          class="button green"
                          @click="reviseCurrentWord(1)"
                          :style="showZh?'':'border:solid 2px #c0cace;color:#c0cace;'"
                        >
                            <div class="button-num"><span>1</span></div>
                            认识
                        </div>
                        <div
                          class="button yellow"
                          @click="reviseCurrentWord(2)"
                          :style="showZh?'':'border:solid 2px #c0cace;color:#c0cace;'"
                        >
                            <div class="button-num"><span>2</span></div>
                            模糊
                        </div>
                        <div
                          class="button red"
                          @click="reviseCurrentWord(3)"
                          :style="showZh?'':'border:solid 2px #c0cace;color:#c0cace;'"
                        >
                            <div class="button-num"><span>3</span></div>
                            不认识
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import word from '@/api/word'

export default {
  name: 'learn',
  components: {},
  data () {
    return {
      showZh: false,
      wordUnit: [],
      unitPointer: 0,
      wordLeft: 0,
      wordReview: 0,
      wordFinished: 0,
      wordTotalNum: 0,
      wordList: '',
      wordType: '',
      wordEn: '',
      wordZh: ''
    }
  },
  created () {
    if (this.$route.query.list) {
      this.wordList = this.$route.query.list
      this.wordTotalNum = word.getListWordNum(this.wordList)
    } else {
      this.$router.go(-1)
    }
  },
  mounted () {
    setTimeout(() => {
      this.getNextUnit()
      this.setStatusNums()
      word.reportUserLearned().then(res => console.log(res)) // beta版测试用
    }, 200)
    document.onkeydown = (event) => {
      switch (event.keyCode) {
        case 32: // space
          this.cardClicked()
          break
        case 49: // num 1
          if (this.wordType === 'new') return this.learnCurrentWord()
          this.reviseCurrentWord(1)
          break
        case 50: // num 2
          this.reviseCurrentWord(2)
          break
        case 51: // num 3
          this.reviseCurrentWord(3)
          break
      }
    }
  },
  computed: {
    progress () { // 这种算法得到的进度不太准
      return (100 * (this.wordReview * 0.3 + this.wordFinished) / this.wordTotalNum).toFixed(2)
    },
    unitProgress () {
      return 100 * ((this.unitPointer / this.wordUnit.length) || 0)
    }
  },
  methods: {
    getNextWord () {
      if (this.wordUnit.length && this.unitPointer < this.wordUnit.length) {
        const word = this.wordUnit[this.unitPointer]
        if (word.type === 'new') this.showZh = true
        else this.showZh = false
        this.wordType = word.type
        this.wordEn = word.wordEn
        this.wordZh = word.wordZh
        this.unitPointer += 1
        this.setStatusNums() // 每次切换下一个词都调用这个比较费资源，临时解决方案
      } else if (this.wordUnit.length) {
        this.getNextUnit()
      } else {
        this.showZh = false
        this.wordType = ''
        this.wordEn = '你已经完成当天任务啦'
        this.wordZh = ''
        this.unitPointer = 0
        this.setStatusNums()
      }
      word.getUserLearned().then(learned => console.log(this.wordEn, learned[this.wordEn])) // beta版测试用
    },
    getNextUnit () {
      word.getNextUnitFromList(this.wordList).then((unit) => {
        this.unitPointer = 0
        this.wordUnit = unit
        this.getNextWord()
      }).catch(err => console.log(err))
    },
    learnCurrentWord () {
      if (!this.showZh) return
      if (this.wordType !== 'new') return
      word.learnWordFromList(this.wordEn, this.wordList).then(() => {
        this.getNextWord()
      }).catch(err => console.log(err))
    },
    reviseCurrentWord (knowType) {
      if (!this.showZh) return
      if (this.wordType !== 'learned') return
      word.reviseWordFromLearned(this.wordEn, knowType, 'learn').then(() => {
        this.getNextWord()
      }).catch(err => console.log(err))
    },
    setStatusNums () {
      word.getListLearningStatus(this.wordList).then((res) => {
        this.wordReview = res.wordReview
        this.wordFinished = res.wordFinished
        this.wordLeft = this.wordTotalNum - this.wordReview - this.wordFinished
      }).catch(err => console.log(err))
    },
    cardClicked () {
      this.showZh = !this.showZh
    },
    goBack () {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.learn {
  width: 100vw;
  height: 100vh;
  background: #F0F0F0;
}

.main {
  height: 100%;
  max-width: 1300px;
  margin: 0 auto;
  position: relative;
}

.main-left {
  width: 220px;
  background: #FFFFFF;
  position: absolute;
  left: 0;
  top: 80px;
  bottom: 0;
  box-shadow: 4px 0 18px 0 rgba(0,0,0,.28);
}

.left-back {
  width: 100%;
  height: 55px;
  padding: 0 20px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  font-size: 14px;
  letter-spacing: 1.5px;
  color: #455358;
  font-weight: 600;
  cursor: pointer;
}

.left-back img {
  width: 16px;
  height: 16px;
  margin-right: 7px;
  margin-top: 2px;
}

.left-main {
  width: 100%;
  padding-top: 30px;
  display: flex;
  flex-direction: column;
}

.left-title {
  display: flex;
  height: 50px;
  align-items: center;
  font-size: 14px;
  letter-spacing: 1.5px;
  font-weight: 600;
  color: #455358;
  padding: 0 20px;
  box-sizing: border-box;
}

.left-title img {
  width: 28px;
  height: 28px;
  margin-right: 4px;
}

.left-counter {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin-top: 50px;
}

.left-number {
  color: #455358;
  font-weight: 700;
  font-size: 20px;
}

.left-counter span {
  color: #455358;
  font-size: 12px;
  font-weight: 600;
}

.left-counter img {
  width: 28px;
  height: 28px;
}

.left-rate {
  position: absolute;
  bottom: 0;
  height: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #455358;
  font-size: 20px;
  font-weight: bolder;
}

.learn-word {
  position: absolute;
  left: 220px;
  right: 0;
  top: 80px;
  bottom: 0;
  padding: 30px;
  box-sizing: border-box;
}

.word-card {
  width: 100%;
  height: 75%;
  background: #FFFFFF;
  position: relative;
  cursor: pointer;
}

.card-progress {
  position: absolute;
  top: 0;
  width: 100%;
  height: 5px;
  background: rgb(128, 209, 185);
}

.card-progress div {
  height: 100%;
  background: #40BC96;
  transition: all 0.2s;
}

.word-en,
.word-zh {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  left: 0;
  color: #455358;
}

.word-zh {
  height: calc(64% - 100px);
  margin: 50px 0;
  font-size: 23px;
  line-height: 30px;
  padding: 0 18%;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: "Microsoft YaHei" !important;
  text-align: left;
  align-items: center;
  justify-content: flex-start;
  white-space: pre-line;
}

.word-en {
  font-size: 26px;
  height: 36%;
  font-family: TimesNewRoman !important;
}

.word-en div {
  width: 100%;
  height: 80%;
}

.word-en span {
  width: 100%;
  text-align: center;
  flex-shrink: 0;
}

.word-choice {
  width: 100%;
  height: 72px;
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 5px;
  box-sizing: border-box;
}

.button {
  width: 30%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  position: relative;
  transition: all 0.4s ease;
}

.new {
  width: 100%;
  border: solid 2px #3CCFCF;
  color: #455358;
}

.green {
  border: solid 2px #90c0ac;
  color: #90c0ac;
}

.yellow {
  border: solid 2px #e0a143;
  color: #e0a143;
}

.red {
  border: solid 2px #cd6c48;
  color: #cd6c48;
}

.button-num {
  width: 20px;
  height: 20px;
  position: absolute;
  left: -10px;
  top: -4px;
  background: #F0F0F0;
  padding: 3px 2px;
}

.button-num span {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #c0cace;
  box-sizing: border-box;
  color: #c0cace;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}
</style>
