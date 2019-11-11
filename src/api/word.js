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

// {
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

const isListExist = (listName) => {
  return !!lists[listName]
}

const getWordList = (listName) => {
  return isListExist(listName) ? lists[listName] : {}
}

// 得到的是一个根据单词的index属性(来自于json源文件)排序过的单词数组而不是对象
const getSortedWordList = (listName) => {
  const wordList = getWordList(listName)
  return Object.keys(wordList).sort((a, b) => {
    // 根据index升序排列
    return wordList[a].index - wordList[b].index
  })
}

const getUserLearned = () => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    cache.getLearnedByUserId(user._id)
      .then(res => resolve(res))
      .catch(err => reject(err))
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
    cache.editUserLearned(user._id, { wordEn, wordZh }, { })
      .then((status) => {
        // ******************************* 1 bug *******************************
        // 如果用户在别的list已经学过该单词，会导致该list的progress.location不被 +1
        // 但如果去掉if条件会导致location错乱
        if (status === 'add' || status === 'new') cache.editUserProgress(user._id, listName, { change: 1 }).then(() => { resolve('success') })
        else resolve('success')
      })
      .catch(err => reject(err))
  })
}

// 复习模式api
// 复习一个list内的某个单词
// 会根据用户选择的[认识，模糊，不认识]来改变该词的记忆周期和不熟悉度
const reviseWordFromList = (wordEn, listName, knowType) => {
  const { user } = store.getters || {}
  const wordZh = ((lists[listName] || {})[wordEn] || {}).value
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!wordZh) return reject(new Error('word not found in list'))
    getUserLearned().then((learned) => {
      const { period, stage, updatedAt } = learned[wordEn] || {}
      if (!period) return reject(new Error('word not learned'))
      let operation = {}
      switch (knowType) {
        case 1: // 认识
          // ***************** 要在这加个判断updatedAt来决定是否增加period *****************
          let periodChange = 0
          const timeNow = Date.now()
          if (period === 1 && (timeNow - updatedAt > 5 * 60 * 1000)) periodChange = 1
          else if (period === 1 && stage <= 6) periodChange = 1
          else if (period === 2 && (timeNow - updatedAt > 30 * 60 * 1000)) periodChange = 1
          else if (period === 2 && stage <= 5) periodChange = 1
          operation = {
            periodChange,
            stageChange: -1
          }
          break
        case 2: // 模糊
          // period <=2 的单词相当于只是更新了下updatedAt
          if (period > 2) {
            operation = {
              period: 4
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
              period: 3,
              stageChange: 1
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
      const sortedList = getSortedWordList(listName) // sort顺序是固定的，每次得到的sortedList顺序一致，以此确保location的精确性
      if (progress && progress.location >= 0) { // list progress record found
        const location = progress.location
        // 在学习模式（ /learn 页面）时，记忆周期为5分钟和30分钟的单词有可能需要在下一个unit进行复习
        // 记忆周期大于30分钟（即12小时， 1天， 2天等）的词在复习模式才会出现
        // PS：有记忆周期的单词肯定是至少学过一次的单词，肯定在learned表里
        // 复习单词优先级高于学习新单词，因此先检查有没有需要复习的单词
        getUserLearned().then((learned) => {
          // 需要复习的单词肯定在学过的单词表里，所以先获取学过的单词
          let wordUnit = []
          if (location >= sortedList.length) { // 当前list内单词全都至少学了一遍，只剩下需要复习的单词
            for (let word of sortedList) {
              if (!learned[word]) {
                // learnWordFromList(word, listName)
                console.log('location is not matched with learned')
                break
              }
              let { period } = learned[word] || {}
              if (period === 1 || period === 2) { // 因为当前list没有更多新词学了，所以剩下的词就不考虑时间有没有到了
                wordUnit.push({
                  ...learned[word],
                  wordEn: word,
                  type: 'learned'
                })
              }
            }
            if (!wordUnit.length) {
              console.log('list learning finished')
              return resolve([]) // 当前list没有需要学习的单词了，返回空对象
            }
            wordUnit = wordUnit.sort((a, b) => {
              // period相等则比较stage，stage相等则比较updatedAt
              // 注意是优先stage大的排前面，然后period大的排前面，最后updatedAt小的排前面
              return (b.stage - a.stage) || (b.period - a.period) || (a.updatedAt - b.updatedAt)
            })
          } else { // 当前list还有没学过的词
            for (let word of sortedList.slice(0, location)) { // 0 ~ location的单词是学过的单词，在learned里有记录
              if (!learned[word]) {
                // learnWordFromList(word, listName)
                console.log('location is not matched with learned')
                break
              }
              let { period, updatedAt } = learned[word] || {}
              const timeDiff = Date.now() - updatedAt
              if ((period === 1 && timeDiff >= 5 * 60 * 1000) || (period === 2 && timeDiff >= 30 * 60 * 1000)) {
                wordUnit.push({
                  ...learned[word],
                  wordEn: word,
                  type: 'learned'
                })
              }
            }
            const unitLength = wordUnit.length
            if (unitLength < 7) {
              console.log(unitLength)
              // 需要复习的单词未满一个unit时，在list里按顺序找单词填满一个unit
              const wordList = getWordList(listName)
              for (let i = 0; i < 7 - unitLength; i++) {
                if (location + i >= sortedList.length) break
                let wordEn = sortedList[location + i]
                let value = wordList[wordEn].value
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
            wordUnit = wordUnit.sort((a, b) => {
              // period相等则比较stage，stage相等则比较updatedAt
              // 和上面的排序方法不一样，注意是优先period和stage大的排前面，然后updatedAt小的排前面
              return (b.period - a.period) || (b.stage - a.stage) || (a.updatedAt - b.updatedAt)
            })
          }
          // ***************** 要在这加同步学习进度location的代码 *****************
          const nextUnit = wordUnit.splice(0, 7).map((obj) => {
            return {
              wordEn: obj.wordEn,
              wordZh: obj.value,
              type: obj.type
            }
          }).sort((a, b) => {
            // 前面的加上stage只是为了让stage大的进入unit，在unit内的学习排序还是按时间来
            return (b.period - a.period) || (a.updatedAt - b.updatedAt)
          })
          resolve(nextUnit)
        }).catch(err => reject(err))
      } else {
        // 整个list都未学过
        // new record added to progress
        let wordUnit = []
        const wordList = getWordList(listName)
        for (let i = 0; i < 7; i++) {
          let wordEn = sortedList[i]
          let wordZh = wordList[wordEn].value
          wordUnit.push({ wordEn, wordZh, type: 'new' })
        }
        resolve(wordUnit)
      }
    }).catch(err => reject(err))
  })
}

const getNextReviseWord = (listName) => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!isListExist(listName)) return reject(new Error('word list not exist'))
    getUserProgress(user._id).then((dict) => {
      const progress = (dict || {})[listName]
      const sortedList = getSortedWordList(listName) // sort顺序是固定的，每次得到的sortedList顺序一致，以此确保location的精确性
      if (progress && progress.location >= 0) { // list progress record found
        const location = progress.location
        // 在学习模式（ /learn 页面）时，记忆周期为5分钟和30分钟的单词有可能需要在下一个进行复习
        // 记忆周期大于30分钟（即12小时， 1天， 2天等）的词在复习模式才会出现
        // PS：有记忆周期的单词肯定是至少学过一次的单词，肯定在learned表里
        // 因此在这里加一个检查下一个单词是否是复习单词的步骤
        getUserLearned().then((learned) => {
          // PS：下面的获取复习单词的算法有很大的优化空间
          let wordUnit = []
          if (location >= sortedList.length) { // 当前list内单词全都至少学了一遍，只剩下需要复习的单词
            for (let word of sortedList) {
              if (!learned[word]) {
                // learnWordFromList(word, listName)
                console.log('location is not matched with learned')
                break
              }
              let { period } = learned[word] || {}
              if (period === 1 || period === 2) { // 因为当前list没有更多新词学了，所以剩下的词就不考虑时间有没有到了
                wordUnit.push({
                  ...learned[word],
                  wordEn: word
                })
              }
            }
            if (!wordUnit.length) {
              console.log('list learning finished')
              resolve({}) // 当前list没有需要学习的单词了，返回空对象
            }
          } else { // 当前list还有没学过的词
            for (let word of sortedList.slice(0, location)) { // 0 ~ location的单词是学过的单词，在learned里有记录
              if (!learned[word]) {
                // learnWordFromList(word, listName)
                console.log('location is not matched with learned')
                break
              }
              let { period, updatedAt } = learned[word] || {}
              const timeDiff = Date.now() - updatedAt
              if ((period === 1 && timeDiff >= 5 * 60 * 1000) || (period === 2 && timeDiff >= 30 * 60 * 1000)) {
                wordUnit.push({
                  ...learned[word],
                  wordEn: word
                })
              }
            }
            if (!wordUnit.length) {
              // 未找到需要复习的单词时，按list顺序返回下一个学习的单词
              const wordEn = sortedList[location]
              const wordZh = getWordList(listName)[wordEn].value
              return resolve({ wordEn, wordZh, type: 'new' })
            }
          }
          let rankedWordList = wordUnit.sort((a, b) => {
            // period相等则比较stage，stage相等则比较updatedAt，注意stage是大的排前面
            return (a.period - b.period) || (b.stage - a.stage) || (a.updatedAt - b.updatedAt)
          })
          console.log(rankedWordList)
          const wordEn = rankedWordList[0].wordEn
          const wordZh = rankedWordList[0].value
          resolve({ wordEn, wordZh, type: 'learned' })
        }).catch(err => reject(err))
      } else {
        // 整个list都未学过
        // new record added to progress
        cache.editUserProgress(user._id, listName, { location: 0, change: 0 })
          .then(() => {
            const wordEn = sortedList[0]
            const wordZh = getWordList(listName)[wordEn].value
            resolve({ wordEn, wordZh, type: 'new' })
          })
          .catch(err => reject(err))
      }
    }).catch(err => reject(err))
  })
}

const word = {
  isListExist,
  getWordList,
  getUserLearned,
  getUserProgress,
  learnWordFromList,
  getNextUnitFromList,
  getNextReviseWord,
  reviseWordFromList
}

export default word
