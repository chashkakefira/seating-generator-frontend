<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <router-link class="navbar-brand fw-bold" to="/">
          <i class="bi bi-grid-3x3-gap-fill me-2"></i>
          Генератор рассадки
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
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Рассажировка</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/classes">Классы</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container-fluid">
      <router-view />
    </main>
  </div>
</template>
