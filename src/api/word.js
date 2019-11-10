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
// 通常在此之前调用getNextLearnWordFromList()来得到当前学习的list里下一个要学的单词是啥
const learnWordFromList = (wordEn, listName) => {
  const { user } = store.getters || {}
  const wordZh = ((lists[listName] || {})[wordEn] || {}).value
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!wordZh) return reject(new Error('word not found in list'))
    const wordObj = { wordEn, wordZh }
    cache.editUserLearned(user._id, wordObj, {})
      .then((status) => {
        if (status === 'add' || status === 'new') cache.editUserProgress(user._id, listName, { change: 1 }).then(res => resolve(res))
        else resolve(status)
      })
      .catch(err => reject(err))
  })
}

// 在学习模式（ /learn 页面）时，需要检查记忆周期为5分钟和30分钟的单词是否需要在下一个复习
// const checkReviseWhenLearn = () => {

// }

// 获取学习模式下下一个学习的词，返回结果是单词的String
// 调用这个api不会造成该改词的属性的变化，仅获取并返回单词
// 通常在后续调用learnWordFromList()将改词添加到已学单词列表中
const getNextLearnWordFromList = (listName) => {
  const { user } = store.getters || {}
  return new Promise((resolve, reject) => {
    if (!user._id) return reject(new Error('user not login'))
    if (!isListExist(listName)) return reject(new Error('word list not exist'))
    getUserProgress(user._id).then((dict) => {
      const progress = (dict || {})[listName]
      const sortedList = getSortedWordList(listName)
      if (progress && progress.location >= 0) {
        // list progress record found
        // checkReviseWhenLearn()
        const wordEn = sortedList[progress.location]
        resolve(wordEn)
      } else {
        // new record added to progress
        cache.editUserProgress(user._id, listName, { location: 0, change: 0 })
          .then(() => { resolve(sortedList[0]) })
      }
    }).catch(err => reject(err))
  })
}

const reviseWordFromList = (wordEn, listName, stageChange) => {

}

const word = {
  isListExist,
  getWordList,
  getUserLearned,
  getUserProgress,
  learnWordFromList,
  getNextLearnWordFromList,
  reviseWordFromList
}

export default word
