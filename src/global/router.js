import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/pages/Home.vue'
import Learn from '@/pages/Learn.vue'
import Revise from '@/pages/Revise.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    redirect: '/home'
  },
  {
    path: '*',
    name: '404',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: Home
  },
  {
    path: '/learn',
    name: 'learn',
    component: Learn
  },
  {
    path: '/revise',
    name: 'revise',
    component: Revise
  }
  // {
  //   path: '/about',
  //   name: 'about',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
