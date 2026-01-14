<script>
/*
 * Copyright (C) 2026 Прокофьев Даниил <danieldzen@yandex.ru>
 * Лицензировано под GNU Affero General Public License v3.0
 * Часть проекта генератора рассадок
 */
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import useClasses from "./composables/useClasses.js";

const route = useRoute();
const router = useRouter();
const { classes, loadClasses, saveClasses, hasErrors } = useClasses();

onMounted(() => {
  loadClasses();
});

const activeClass = computed(() => {
  const id = route.params.id;
  if (!id) return null;
  return classes.value.find((c) => String(c.id) === String(id));
});

const handleSeating = () => {
  saveClasses();
  const id = route.params.id;
  if (!hasErrors.value && id) {
    router.push(`/generate/${id}`);
  }
};
</script>
<template>
  <div id="app" class="d-flex flex-column vh-100">
    <nav
      class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm flex-shrink-0"
    >
      <div class="container-fluid">
        <router-link class="navbar-brand fw-bold" to="/">
          Генератор рассадок
        </router-link>
      </div>
    </nav>

    <main class="flex-grow-1 overflow-y-auto position-relative p-0">
      <router-view />
    </main>

    <footer class="py-3 bg-light border-top flex-shrink-0">
      <div class="container-fluid text-center">
        <span class="text-muted small">
          © 2026 Прокофьев Даниил |
          <a
            href="https://github.com/chashkakefira/seating-generator"
            class="text-decoration-none text-primary"
            >Исходный код (AGPLv3)</a
          >
        </span>
      </div>
    </footer>
  </div>
</template>

<style>
.navbar-brand {
  letter-spacing: -0.5px;
}
.nav-link {
  transition: opacity 0.2s;
}
.nav-link:hover {
  opacity: 0.8;
}
</style>
