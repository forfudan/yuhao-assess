import { createApp } from 'vue'
import App from './App.vue'
import './styles/global.css'

console.log('main.ts loaded')

try {
  const app = createApp(App)
  console.log('App created')
  app.mount('#app')
  console.log('App mounted')
} catch (error) {
  console.error('Error mounting app:', error)
}
