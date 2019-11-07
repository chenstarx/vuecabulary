import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('user') || '{}') // read localstorage to login
  },
  mutations: {
    setUser: (state, user) => {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
      // below is a local database 'insert' operation
      localStorage.setItem(user.username, JSON.stringify(user))
    },
    logout: (state) => {
      state.user = {}
      localStorage.removeItem('user')
    }
  },
  actions: {
    updateUser: ({ commit, state }, data) => {
      commit('setUser', {
        ...state.user,
        ...data
      })
    }
  },
  modules: {
  }
})
