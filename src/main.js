import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import VueResizeText from 'vue-resize-text';
import App from './App.vue';
const app = createApp(App);
app.mount('#app');
app.use(VueResizeText);