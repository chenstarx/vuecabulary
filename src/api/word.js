import cache from '@/api/cache'
import store from '@/global/store'

import list1 from '@/static/words/List1.json'
import list2 from '@/static/words/List2.json'
import list3 from '@/static/words/List3.json'
import list4 from '@/static/words/List4.json'
import list5 from '@/static/words/List5.json'
import list6 from '@/static/words/List6.json'

// 词汇api设计大体上分为学习模式的api和复习模式的api

// 学习模式即学习新词
// - 对应的应用在 /learn 页面下
// - 单词记忆周期为5分钟和30分钟的词（learned.words[word].period <= 2）也会在学习模式中出现（本地数据库的数据结构在cache.js里有介绍）

// 复习模式即复习学习过的词
// - 对应的应用在 /revise 页面下
// - 被添加到一个user的learned表里的词汇就算是这个用户学过的词
// - 根据记忆周期period和不熟练度stage来计算不同单词的权重，然后根据权重排序决定下一个要复习的词

cache.connect()

// 测试用list
// list1: {
//   a: { value: '1', index: 1 },
//   b: { value: '2', index: 2 },
//   c: { value: '3', index: 3 },
//   d: { value: '4', index: 4 },
//   e: { value: '5', index: 5 },
//   f: { value: '6', index: 6 },
//   g: { value: '7', index: 7 },
//   h: { value: '8', index: 8 },
//   j: { value: '9', index: 9 }
// }

const lists = {
  list1,
  list2,
  list3,
  list4,
  list5,
  list6
}

// 艾宾斯浩记忆周期，用数字来对应时间，单位毫秒
// 5分钟和30分钟的周期的单词通常是学习模式（ /learn页面 ）下复习
// 12小时或12小时以上周期的单词在复习模式（ /revise页面 ）下复习
// 这里的时间是指距离上次学习（用户点了<认识>按钮且被判定为当前周期已记住）后过去的时间，即 Date.now() - updatedAt
const periodTime = {
  1: 1000 * 60 * 5, // 周期1： 5分钟
  2: 1000 * 60 * 30, // 周期2： 30分钟
  3: 1000 * 60 * 60 * 9, // 周期3： 12小时，PS：减3小时是为了防止可能本来晚上需要复习一遍的单词被推到第二天
  4: 1000 * 60 * 60 * 24 * 1, // 周期4： 1天
  5: 1000 * 60 * 60 * 24 * 2, // 周期5： 2天
  6: 1000 * 60 * 60 * 24 * 4, // 周期6： 4天
  7: 1000 * 60 * 60 * 24 * 7, // 周期7： 7天
  8: 1000 * 60 * 60 * 24 * 15, // 周期8： 15天
  9: 1000 * 60 * 60 * 24 * 31 // 周期9： 31天
}

const getPeriodTime = (period) => {
  return periodTime[period]
}

const isListExist = (listName) => {
  return !!lists[listName]
}

const getWordList = (listName) => {
  return isListExist(listName) ? lists[listName] : {}
}

const getListWordNum = (listName) => {
  return isListExist(listName) ? Object.keys(lists[listName]).length : 0
}

// 得到的是一个根据单词的index属性(来自于json源文件)排序过的单词数组而不是对象
const getSortedWordList = (listName) => {
  const wordList = getWordList(listName)
  return Object.keys(wordList).sort((a, b) => {
    // 根据index升序排列
    return wordList[a].index - wordList[b].index
  })
}

// 获取当前用户学过的所有单词，返回数据包含单词的学习状态(period, stage, updatedAt)
const getUserLearned = () => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    cache.getLearnedByUserId(user._id)
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

// 测试用，报告当前用户学习情况
const reportUserLearned = () => {
  return new Promise((resolve, reject) => {
    getUserLearned().then((learned) => {
      let report = {}
      for (let word in learned) {
        report[word] = {
          period: learned[word].period,
          stage: learned[word].stage
        }
      }
      resolve(report)
    }).catch(err => reject(err))
  })
}

// 获取当前用户需要复习的单词数量
const getReviseWordNum = () => {
  return new Promise((resolve, reject) => {
    getUserLearned().then((learned) => {
      let wordNum = 0
      for (let word in learned) {
        let { period, updatedAt } = learned[word] || {}
        if (!period || !updatedAt || period > 9) continue
        // period大于9被认为是已经完全记住，不需要再复习
        let timeDiff = Date.now() - updatedAt
        if (timeDiff > periodTime[period] || period === 1 || period === 2) wordNum += 1
      }
      resolve(wordNum)
    }).catch(err => reject(err))
  })
}

// 获取一个list的学习状态，返回需巩固单词，已掌握单词的数量
const getListLearningStatus = (listName) => {
  return new Promise((resolve, reject) => {
    if (!isListExist(listName)) return reject(new Error('word list not found'))
    getUserLearned().then((learned) => {
      const wordDict = getWordList(listName)
      let wordReview = 0
      let wordFinished = 0
      for (let word in learned) {
        if (!wordDict[word]) continue
        let { period } = learned[word] || {}
        if (!period || period > 9) continue
        // period大于9被认为是已经完全记住，不需要再复习
        if (period <= 2) wordReview += 1
        else if (period > 2) wordFinished += 1
      }
      resolve({ wordReview, wordFinished })
    }).catch(err => reject(err))
  })
}

const getUserProgress = () => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    cache.getProgressByUserId(user._id)
      .then(res => resolve(res))
      .catch(err => reject(err))
  })
}

// 将一个list里的某一个单词标记为已学，即添加到本地数据库的learned表里
// 因为输入的wordEn只是一个String单词的名称，因此需要对应listName找到单词所在list来获取完整单词对象
// 通常在此之前调用getNextUnitFromList()来得到要学的单词
const learnWordFromList = (wordEn, listName) => {
  const { user } = store.getters || {}
  const wordZh = ((lists[listName] || {})[wordEn] || {}).value
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!wordZh) return reject(new Error('word not found in list'))
    getUserLearned().then((learned) => {
      const isLearned = !!learned[wordEn]
      if (isLearned) { // 单词已经学过了，一般是在别的list学过
        getUserProgress().then((progress) => {
          const location = ((progress || {})[listName] || {}).location || 0
          const sortedList = getSortedWordList(listName)
          if (sortedList.slice(0, location).indexOf(wordEn) >= 0) { // 在当前list学过
            resolve('success')
          } else { // 在别的list学过
            cache.editUserProgress(user._id, listName, { change: 1 })
              .then(() => { resolve('success') })
              .catch(err => reject(err))
          }
        })
      } else {
        cache.editUserLearned(user._id, { wordEn, wordZh }, { })
          .then((status) => {
            if (status === 'add' || status === 'new') cache.editUserProgress(user._id, listName, { change: 1 }).then(() => { resolve('success') })
            else resolve('success')
          })
          .catch(err => reject(err))
      }
    })
  })
}

// 复习模式api
// 复习一个list内的某个单词
// 会根据用户选择的[认识，模糊，不认识]来改变该词的记忆周期和不熟悉度
const reviseWordFromLearned = (wordEn, knowType, mode) => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    getUserLearned().then((learned) => {
      const wordZh = (learned[wordEn] || {}).value
      const { period, stage, updatedAt } = learned[wordEn] || {}
      if (!period || !wordZh) return reject(new Error('word not learned'))
      let operation = {}
      switch (knowType) {
        case 1: // 认识
          let periodChange = 0
          const isPeriodReached = Date.now() - updatedAt > periodTime[period] // true or false
          // 之所以做如下处理是为了防止period上升过快，导致用户实际上没记住该单词就被系统判定学完了该单词
          // 如果去掉这两if判断，一个单词只要用户点了两次 <认识>，该单词就会进入下一个记忆周期
          // 这里的判断可以理解为 “系统认为在当前复习周期，用户已经记住了该单词，可以进入下一个记忆周期”
          if ((period === 1 && (isPeriodReached || stage <= 6)) ||
              (period === 2 && (isPeriodReached || stage <= 5)) ||
              (period === 3 && (isPeriodReached || stage <= 4)) ||
              (period === 4 && (isPeriodReached || stage <= 3)) ||
              (period === 5 && (isPeriodReached || stage <= 2)) ||
              (period === 6 && (isPeriodReached || stage <= 1)) ||
              (period >= 7 && (isPeriodReached || stage <= 0))) periodChange = 1
          // 一般触发 state <= n 条件都是在学习模式学完所有新词开始复习，或者在刷词模式下
          // 根据记忆理论，一个单词复习7次（每次都认识）就可以完全记住该单词
          operation = {
            periodChange,
            stageChange: -1
          }
          break
        case 2: // 模糊
          if (period <= 2) {
            operation = {
              period: 1,
              stageChange: mode === 'learn' ? 0.5 : 0
            }
          } else {
            operation = {
              period: 1,
              stageChange: 1
            }
          }
          break
        case 3: // 不认识
          if (period <= 2) {
            operation = {
              period: 1,
              stageChange: 1
            }
          } else {
            operation = {
              period: 1,
              stageChange: 2
            }
          }
          break
      }
      cache.editUserLearned(user._id, { wordEn, wordZh }, operation)
        .then(status => resolve(status))
        .catch(err => reject(err))
    }).catch(err => reject(err))
  })
}

// 学习模式api
// 获取学习模式下一个学习的unit（7个单词），返回结果是单词对象数组
// 调用这个api不会造成单词的属性的变化，仅获取单词
// 返回值范例
// [{
//   wordEn: 'controversial',
//   wordZh: 'adj. 有争议的，引起争论的',
//   type: 'learned'
// }, {
//   wordEn: 'complicated',
//   wordZh: 'adj. 复杂的',
//   type: 'new'
// }]
const getNextUnitFromList = (listName) => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!isListExist(listName)) return reject(new Error('word list not exist'))
    getUserProgress(user._id).then((dict) => {
      const progress = (dict || {})[listName]
      const { location } = progress || {}
      const wordDict = getWordList(listName) // 下面的是数组，这里的是对象
      const sortedList = getSortedWordList(listName) // sort顺序是固定的，每次得到的sortedList顺序一致，以此确保location的精确性
      if (location >= 0) { // list progress record found
        // 在学习模式（ /learn 页面）时，记忆周期为5分钟和30分钟的单词有可能需要在下一个unit进行复习
        // 记忆周期大于30分钟（即12小时， 1天， 2天等）的词在复习模式才会出现
        // PS：有记忆周期的单词肯定是至少学过一次的单词，肯定在learned表里
        // 复习单词优先级高于学习新单词，因此先检查有没有需要复习的单词
        getUserLearned().then((learned) => {
          // 需要复习的单词肯定在学过的单词表里，所以先获取学过的单词
          let wordUnit = []
          // 到周期的单词优先复习
          const timeNow = Date.now()
          for (let word of sortedList.slice(0, location)) { // 0 ~ location的单词是学过的单词，在learned里有记录
            let { period, updatedAt } = learned[word] || {}
            if (!period || !updatedAt) continue // 触发这种情况是location大于实际进度了，一般不会发生
            let timeDiff = timeNow - updatedAt
            if ((period === 1 || period === 2) && timeDiff >= periodTime[period]) {
              wordUnit.push({
                ...learned[word],
                wordEn: word,
                type: 'learned'
              })
            }
          }
          // 到周期的单词未填满一个unit
          const unitLen = wordUnit.length
          if (unitLen < 7) {
            if (location >= sortedList.length) { // 当前list内单词全都至少学了一遍，只剩下需要复习的单词
              let wordTempUnit = []
              for (let word of sortedList) {
                let { period, updatedAt } = learned[word] || {}
                if (!period || !updatedAt) continue // 触发这种情况是location大于实际进度了，一般不会发生
                let timeDiff = timeNow - updatedAt
                // 和上面到周期取单词互补的条件，防止取出重复的单词
                if ((period === 1 || period === 2) && timeDiff < periodTime[period]) {
                  wordTempUnit.push({
                    ...learned[word],
                    wordEn: word,
                    type: 'learned'
                  })
                }
              }
              if (!unitLen && !wordTempUnit.length) {
                console.log('list learning finished')
                return resolve([]) // 当前list没有需要学习的单词了，返回空对象
              }
              wordTempUnit = wordTempUnit.sort((a, b) => {
                // 注意是优先stage大的排前面，然后period大的排前面，最后updatedAt小的排前面
                return (b.stage - a.stage) || (b.period - a.period) || (a.updatedAt - b.updatedAt)
              })
              // 拼接两个list，拼出来的wordUnit长度小于等于7
              wordUnit = wordTempUnit.splice(0, 7 - unitLen).concat(wordUnit)
            } else { // 当前list还有没学过的词
              // 需要复习的单词未满一个unit时，在list里按顺序找单词填满一个unit
              for (let i = 0; i < 7 - unitLen; i++) {
                if (location + i >= sortedList.length) break
                let wordEn = sortedList[location + i]
                let value = wordDict[wordEn].value
                let newWord = {
                  wordEn,
                  value,
                  period: 0, // 因为还没学过所以period算0，保证在unit内排在要复习的单词前
                  stage: 7,
                  type: 'new'
                }
                wordUnit.push(newWord)
              }
            }
          } else {
            wordUnit = wordUnit.sort((a, b) => {
              // 30分钟周期优先，因为5分钟周期的单词可能特别多
              return (b.period - a.period) || (a.updatedAt - b.updatedAt)
            })
          }
          const nextUnit = wordUnit.splice(0, 7).map((obj) => {
            return {
              wordEn: obj.wordEn,
              wordZh: obj.value,
              type: obj.type
            }
          })
          resolve(nextUnit)
        }).catch(err => reject(err))
      } else {
        // 整个list都未学过
        // new record added to progress
        let wordUnit = []
        for (let i = 0; i < 7; i++) {
          let wordEn = sortedList[i]
          let wordZh = wordDict[wordEn].value
          wordUnit.push({ wordEn, wordZh, type: 'new' })
        }
        resolve(wordUnit)
      }
    }).catch(err => reject(err))
  })
}

// 复习模式api
// 获取下一个要复习的unit
// 返回数据结构和getNextUnitFromList()一致
const getNextUnitFromLearned = () => {
  return new Promise((resolve, reject) => {
    getUserLearned().then((learned) => {
      let wordUnit = []
      const timeNow = Date.now()
      // 到记忆周期的单词，或者还处在5分钟周期的单词优先复习
      for (let word in learned) {
        let { period, updatedAt } = learned[word] || {}
        if (!period || !updatedAt || period > 9) continue
        // period大于9被认为是已经完全记住，不需要再复习
        let timeDiff = timeNow - updatedAt
        // 还处在5分钟记忆周期的单词，不管时间有没有到周期都加入排序
        if (period === 1 || timeDiff > periodTime[period]) {
          wordUnit.push({
            ...learned[word],
            wordEn: word,
            type: 'learned'
          })
        }
      }
      const unitLen = wordUnit.length
      if (unitLen < 7) {
        // 如果没填满一个unit，就从period为2但还没到达复习周期（period为2时周期是30分钟）的单词里取单词
        // 只有在复习任务基本完成，需要复习的单词只剩下一些period为2但是还没到30分钟周期的单词时会触发
        let wordTempUnit = []
        for (let word in learned) {
          let { period, updatedAt } = learned[word] || {}
          if (period !== 2 || !period || !updatedAt) continue
          // 因为只有 period < 3 的单词才能在没到周期的情况下复习
          // 而上面取单词的条件包含 period == 1，因此这里可以直接简化为period !== 2就跳过
          if (timeNow - updatedAt <= periodTime[period]) { // 此时period肯定为2
            wordTempUnit.push({
              ...learned[word],
              wordEn: word,
              type: 'learned'
            })
          }
        }
        wordTempUnit = wordTempUnit.sort((a, b) => { return (b.stage - a.stage) || (a.updatedAt - b.updatedAt) })
        wordUnit = wordUnit.concat(wordTempUnit.splice(0, 7 - unitLen))
      } else {
        wordUnit = wordUnit.sort((a, b) => {
          // 注意这里period排序和学习模式反过来了，period小的优先复习
          return ((b.stage - a.stage) + 2 * (a.period - b.period)) || (a.updatedAt - b.updatedAt)
        })
      }
      const nextUnit = wordUnit.splice(0, 7).sort((a, b) => {
        // 在unit内还是period大的优先
        return (b.period - a.period) || (a.updatedAt - b.updatedAt)
      }).map((obj) => {
        return {
          wordEn: obj.wordEn,
          wordZh: obj.value,
          type: obj.type
        }
      })
      resolve(nextUnit)
    }).catch(err => reject(err))
  })
}

const word = {
  getPeriodTime,
  isListExist,
  getWordList,
  getListWordNum,
  getUserLearned,
  reportUserLearned,
  getReviseWordNum,
  getListLearningStatus,
  getUserProgress,
  learnWordFromList,
  getNextUnitFromList,
  getNextUnitFromLearned,
  reviseWordFromLearned
}

export default word
