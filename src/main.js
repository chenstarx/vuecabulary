import Vue from 'vue'
import App from '@/App.vue'
import router from '@/global/router'
import store from '@/global/store'
import event from '@/utils/event'

Vue.prototype.$event = event

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
