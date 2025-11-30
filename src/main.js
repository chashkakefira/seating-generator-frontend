import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import App from './App.vue'
import Home from './Home.vue';
import ClassesList from './ClassesList.vue'
import ClassEditor from './ClassEditor.vue';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: Home},
        {path: '/classes-list', component: ClassesList},
        {path: '/class/:id', name: 'ClassEditor', component: ClassEditor, props: true},
    ]
})
const app = createApp(App);
app.use(router);
app.mount('#app');