import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import {BootstrapVueNextResolver} from 'bootstrap-vue-next/resolvers'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver(), IconsResolver()],
    }),
    Icons({autoInstall: true, })
  ],
  server: {
    proxy: {
      '/generate-seating': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

