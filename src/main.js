import Vue from 'vue'
import App from '@/App.vue'
import router from '@/global/router'
import store from '@/global/store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
