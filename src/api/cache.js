// 基于HTML5 indexDB的本地数据库
// 在云端数据库上线后可作为本地与云端之间的缓存，减少服务器更新压力，因此取名cache.js

var db

const config = {
  database: 'test3',
  version: 1
}

// 连接数据库并初始化
const connect = () => {
  if (db) return console.log('db already connected')

  const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB

  if (!indexedDB) return alert('你的浏览器版本太旧，将导致本站无法正常使用')

  const connection = indexedDB.open(config.database, config.version)

  connection.onsuccess = (e) => {
    db = e.target.result
    console.log('indexDB connected')
  }

  connection.onerror = (e) => {
    console.log(e.currentTarget.error.message)
    alert('缓存加载失败，请刷新页面')
  }

  connection.onupgradeneeded = (e) => {
    console.log('db initialization')
    db = e.target.result

    // user: {  // user表
    //   _id,  // 用户id，用于表间索引
    //   username,  // 用户名
    //   password,  // 密码
    //   createdAt // 用户创建时间
    // }

    if (!db.objectStoreNames.contains('user')) {
      let objectStore = db.createObjectStore('user', {
        keyPath: '_id',
        autoIncrement: true
      })

      objectStore.createIndex('username', 'username', { unique: true })
      objectStore.createIndex('password', 'password', { unique: false })
      objectStore.createIndex('createdAt', 'createdAt', { unique: false })

      console.log('user table created')
    }

    // learned: {  // 学过的单词表
    //   _id,
    //   user: 10000,  // user._id，索引到user表
    //   words: {
    //     word1: {  // 单词本身就是字段名
    //       value: "translation",  // 单词的中文翻译
    //       period: 1,  // 艾宾斯浩复习周期，1代表5分钟周期，2代表30分钟周期，以此类推
    //       stage: 7,  // 不熟练度，数字越大表示越不熟练，为0时表示完全掌握，新背单词默认为7
    //       updatedAt: Date.now()   // 上次复习时间，配合period, stage即可算出该单词复习权重
    //     },
    //     word2: { ... }
    //   }
    // }

    if (!db.objectStoreNames.contains('learned')) {
      let objectStore = db.createObjectStore('learned', {
        keyPath: '_id',
        autoIncrement: true
      })

      objectStore.createIndex('user', 'user', { unique: true })
      objectStore.createIndex('words', 'words', { unique: false })

      console.log('learned table created')
    }

    // progress: {  // 学习进度表
    //   _id,
    //   user: 10000,
    //   lists: {
    //     list1: {  // list的名字本身就是字段名
    //       location: 255,  // 表示该list用户已经学过的单词数量（只要看一次就算学过，单词会被加到user.learned里）
    //       startedAt: Date.now()  // 开始学习的时间
    //       updatedAt: Date.now()  // 上次学习的时间
    //     },
    //     list2: { ... }
    //   }
    // }

    if (!db.objectStoreNames.contains('progress')) {
      let objectStore = db.createObjectStore('progress', {
        keyPath: '_id',
        autoIncrement: true
      })

      objectStore.createIndex('user', 'user', { unique: true })
      objectStore.createIndex('lists', 'lists', { unique: false })

      console.log('progress table created')
    }
  }
}

// 未用到
const newUser = (user) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('user', 'readwrite')

    let store = transaction.objectStore('user')

    let request = store.add(user)

    request.onsuccess = (e) => {
      console.log('new user created')
      resolve(e.target.result)
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 未用到
const getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('user', 'readwrite')

    let store = transaction.objectStore('user')

    let request = store.get(userId)

    request.onsuccess = (e) => { resolve(e.target.result) }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 未用到
const getUserByName = (username) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('user', 'readwrite')

    let store = transaction.objectStore('user')

    let request = store.index('username').get(username.toLowerCase())

    request.onsuccess = (e) => { resolve(e.target.result) }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 用户登录，如果username未被注册则注册新用户
const userLogin = (username, password) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('user', 'readwrite')

    let store = transaction.objectStore('user')

    let request = store.index('username').get(username.toLowerCase())

    request.onsuccess = (e) => {
      let user = e.target.result
      if (user) {
        // username registered
        if (password === user.password) resolve(e.target.result)
        else return reject(new Error('password'))
      } else {
        // username not exist, create new user
        user = {
          username,
          password,
          createdAt: Date.now()
        }

        let addRequest = store.add(user)

        addRequest.onsuccess = (e) => {
          console.log('new user created')
          resolve({ _id: e.target.result, ...user })
        }

        addRequest.onerror = (e) => { reject(e.target.error) }
      }
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 获取一个用户学过的所有单词的和单词的学习进度，即learned表的words字段
// 返回值范例
// {
//   word1: {
//     value: "translation",
//     period: 1,
//     stage: 7,
//     updatedAt: Date.now()
//   },
//   word2: { ... }
// }
const getLearnedByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('learned', 'readwrite')

    let store = transaction.objectStore('learned')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      // 注意这里返回的是learned表里的words字段，方便应用
      const { words } = e.target.result || {}
      if (words) resolve(words)
      else resolve({})
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 获取一个用户学过的list和对应list的学习情况，即progress表的lists字段
// 返回值范例
// {
//   list1: {
//     location: 255,
//     startedAt: Date.now(),
//     updatedAt: Date.now()
//   },
//   list2: { ... }
// }
const getProgressByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('progress', 'readwrite')

    let store = transaction.objectStore('progress')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      // 注意这里返回的是progress表里的lists字段，方便应用
      const { lists } = e.target.result || {}
      if (lists) resolve(lists)
      else resolve({})
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 获取用户某一个list的学习情况
// 返回值范例
// {
//   location: 255,
//   startedAt: Date.now()
// }
const getUserListProgress = (userId, listName) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('progress', 'readwrite')

    let store = transaction.objectStore('progress')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      const { lists } = e.target.result || {}
      if (lists && lists[listName]) resolve(lists[listName])
      else resolve({})
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 判断用户是否学习过某个单词
const isUserLearnedWord = (userId, wordEn) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('learned', 'readwrite')

    let store = transaction.objectStore('learned')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      let { words } = e.target.result || {}
      if (words && words[wordEn]) resolve(true)
      else resolve(false)
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 给用户已学过单词列表编辑某一个单词的属性
// 如果单词未学过就将单词添加进列表
// 如果单词已在列表里面就更新period和stage
// (用户id，单词对象，{记忆周期变化，熟悉度变化})
const editUserLearned = (userId, wordObj, { period = 0, stage = 0, periodChange = 0, stageChange = 0 }) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    const { wordEn, wordZh } = wordObj || {}
    if (!wordEn || !wordZh) return reject(new Error('word object incorrect'))

    let transaction = db.transaction('learned', 'readwrite')

    let store = transaction.objectStore('learned')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      let learned = e.target.result
      let findFlag = false
      if (learned) { // 用户有学习记录
        if (learned.words && learned.words[wordEn]) {
          findFlag = true
          learned = {
            ...learned,
            words: {
              ...learned.words,
              [wordEn]: {
                value: wordZh,
                period: period || learned.words[wordEn].period + periodChange,
                stage: stage || learned.words[wordEn].stage + stageChange, // stageChange = -1 or 0 or 1，对应认识，模糊，不认识
                updatedAt: Date.now()
              }
            }
          }
        } else {
          learned = {
            ...learned,
            words: {
              ...(learned.words || {}),
              [wordEn]: {
                value: wordZh,
                period: period || 1,
                stage: stage || 7,
                updatedAt: Date.now()
              }
            }
          }
        }
        let putRequest = store.put(learned)

        putRequest.onsuccess = (e) => {
          if (findFlag) {
            console.log('word status updated')
            resolve('update')
          } else {
            console.log('new word added to learned')
            resolve('add')
          }
        }

        putRequest.onerror = (e) => { reject(e.target.error) }
      } else { // 用户没有学习记录
        learned = {
          user: userId,
          words: {
            [wordEn]: {
              value: wordZh,
              period: period || 1,
              stage: stage || 7,
              updatedAt: Date.now()
            }
          }
        }
        let addRequest = store.add(learned)

        addRequest.onsuccess = (e) => {
          console.log('new learned record created')
          resolve('new')
        }

        addRequest.onerror = (e) => { reject(e.target.error) }
      }
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

// 给用户学习进度表（progress表）编辑某一个list的属性
// 如果list未学过就将list添加进列表
// 如果list已在列表里面就更新list当前的学习情况
// change一般情况下表示该list新学单词数量，即location增量
const editUserProgress = (userId, listName, { location = 0, change = 0 }) => {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('db not connected'))

    let transaction = db.transaction('progress', 'readwrite')

    let store = transaction.objectStore('progress')

    let request = store.index('user').get(userId)

    request.onsuccess = (e) => {
      // 注意这里返回的是progress表里的lists字段，方便应用
      let progress = e.target.result
      let findFlag = false
      if (progress) {
        if (progress.lists && progress.lists[listName]) {
          // 找到了该list
          findFlag = true
          progress = {
            ...progress,
            lists: {
              ...progress.lists,
              [listName]: {
                startedAt: progress.lists[listName].startedAt,
                location: location || progress.lists[listName].location + change,
                updatedAt: Date.now()
              }
            }
          }
        } else {
          // 未找到该list
          progress = {
            ...progress,
            lists: {
              ...(progress.lists || {}),
              [listName]: {
                location: location + change,
                startedAt: Date.now(),
                updatedAt: Date.now()
              }
            }
          }
        }
        let putRequest = store.put(progress)

        putRequest.onsuccess = (e) => {
          if (findFlag) {
            console.log('list progress edited')
            resolve('update')
          } else {
            console.log('new list added to progress')
            resolve('add')
          }
        }

        putRequest.onerror = (e) => { reject(e.target.error) }
      } else {
        // 该用户的progress暂未建立记录
        progress = {
          user: userId,
          lists: {
            [listName]: {
              location: location + change,
              startedAt: Date.now(),
              updatedAt: Date.now()
            }
          }
        }
        let addRequest = store.add(progress)

        addRequest.onsuccess = (e) => {
          console.log('new progress record created')
          resolve('new')
        }

        addRequest.onerror = (e) => { reject(e.target.error) }
      }
    }

    request.onerror = (e) => { reject(e.target.error) }
  })
}

const cache = {
  connect,
  newUser,
  getUserById,
  getUserByName,
  userLogin,
  getLearnedByUserId,
  getProgressByUserId,
  getUserListProgress,
  isUserLearnedWord,
  editUserLearned,
  editUserProgress
}

export default cache
