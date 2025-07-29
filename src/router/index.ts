import { createRouter, createWebHashHistory } from "vue-router"

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: () => import('../components/Login.vue')
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('../components/Main.vue')
    }
  ]
})