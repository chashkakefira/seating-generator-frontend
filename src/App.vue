<template>
  <div id="app" class="d-flex flex-column vh-100">
    <nav
      class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm flex-shrink-0"
    >
      <div class="container-fluid">
        <router-link class="navbar-brand fw-bold" to="/">
          Генератор рассадок
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/classes-list">
                Мои классы
              </router-link>
            </li>

            <li v-if="activeClass" class="nav-item d-flex align-items-center">
              <span class="navbar-text mx-2 text-white-50">/</span>
              <router-link
                class="nav-link active fw-bold"
                :to="{ name: 'ClassEditor', params: { id: activeClass.id } }"
              >
                {{ activeClass.name }}
              </router-link>
            </li>
          </ul>

          <ul v-if="activeClass" class="navbar-nav ms-auto">
            <li class="nav-item">
              <BButton
                :to="{ name: 'Generator', params: { id: activeClass.id } }"
                variant="light"
                size="sm"
                class="rounded-pill px-3 fw-bold text-primary shadow-sm"
              >
                <i-bi-magic /> Рассадить
              </BButton>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main
      class="container-fluid flex-grow-1 overflow-hidden position-relative p-0"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import useClasses from "./composables/useClasses.js";

const route = useRoute();
const { classes, loadClasses } = useClasses();

onMounted(() => {
  loadClasses();
});

const activeClass = computed(() => {
  const id = route.params.id;
  if (!id) return null;
  return classes.value.find((c) => String(c.id) === String(id));
});
</script>

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
