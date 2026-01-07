<template>
  <BApp>
    <div v-if="cls" class="container py-5 min-vh-100">
      <div class="d-flex align-items-center justify-content-between mb-5">
        <div class="d-flex align-items-center">
          <BButton
            :to="`/`"
            variant="light"
            class="me-4 border shadow-sm hover-lift"
          >
            <i-bi-arrow-left />
          </BButton>
          <div>
            <h2 class="fw-bold mb-0 text-dark">Архив рассадок</h2>
            <p class="text-muted mb-0 small">
              {{ cls.name }} • {{ cls.students?.length }} учеников
            </p>
          </div>
        </div>
      </div>

      <div v-if="cls.seatings?.length" class="row g-4">
        <div
          v-for="(seating, index) in [...cls.seatings].reverse()"
          :key="seating.Date"
          class="col-md-6 col-lg-4 fade-in-up"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <div class="card h-100 border-0 shadow-sm history-card">
            <div class="card-body p-4">
              <div
                class="d-flex justify-content-between align-items-start mb-3"
              >
                <div class="variant-badge">
                  Вариант №{{ cls.seatings.length - index }}
                </div>
                <BButton
                  variant="link"
                  class="p-0 text-danger opacity-50 hover-opacity-100"
                  @click="confirmDelete(seating.Date)"
                >
                  <i-bi-trash />
                </BButton>
              </div>

              <div class="mb-4">
                <div class="d-flex align-items-center text-dark fw-medium">
                  <i-bi-calendar3 class="me-2 text-primary" />
                  {{ formatFullDate(seating.Date).date }}
                </div>
                <div class="small text-muted ms-4">
                  {{ formatFullDate(seating.Date).time }}
                </div>
              </div>

              <BButton
                variant="primary"
                class="w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center btn-view"
                @click="openPreview(seating)"
              >
                Посмотреть схему
                <i-bi-eye class="ms-2" />
              </BButton>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-5">
        <div class="empty-state-icon mb-3">
          <i-bi-folder2-open class="display-1 text-light" />
        </div>
        <h4 class="text-muted">История пуста</h4>
        <p class="text-secondary">
          Здесь будут появляться сохраненные варианты рассадки.
        </p>
      </div>
    </div>

    <BModal
      v-model="showModal"
      size="xl"
      centered
      hide-footer
      body-class="p-0 overflow-hidden"
      content-class="border-0 shadow-2xl glass-modal"
    >
      <template #modal-header>
        <div
          class="d-flex align-items-center justify-content-between w-100 px-2"
        >
          <div>
            <h5 class="modal-title fw-bold mb-0">{{ selectedSeatingDate }}</h5>
            <span class="badge bg-primary-subtle text-primary small"
              >Просмотр архива</span
            >
          </div>

          <div class="canvas-tools">
            <div class="btn-group bg-white p-1 rounded-3 border shadow-sm">
              <button
                class="btn btn-sm btn-light-hover rounded-2 px-3"
                @click="zoomOut"
              >
                -
              </button>
              <div
                class="d-flex align-items-center px-3 fw-bold text-primary small border-start border-end"
              >
                {{ Math.round(scale * 100) }}%
              </div>
              <button
                class="btn btn-sm btn-light-hover rounded-2 px-3"
                @click="zoomIn"
              >
                +
              </button>
              <button
                class="btn btn-sm btn-light-hover rounded-2 ms-1 text-muted"
                @click="resetView"
              >
                <i-bi-arrow-counterclockwise />
              </button>
            </div>
          </div>
        </div>
      </template>

      <div class="canvas-viewport">
        <div
          class="grab-surface"
          @mousedown.prevent="startPan"
          @mousemove="panning"
          @mouseup="endPan"
          @mouseleave="endPan"
          @wheel.prevent="onWheel"
        >
          <div class="canvas-content" :style="canvasStyle">
            <ClassMap
              v-if="activeSeatingData"
              :config="historyConfig"
              :seating="activeSeatingData"
            />
          </div>
        </div>

        <div class="canvas-hint">
          <i-bi-arrows-move class="me-2" />
          <span>Левая кнопка мыши для перемещения • Колесо для зума</span>
        </div>
      </div>
    </BModal>
  </BApp>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import useClasses from "./composables/useClasses.js";
import ClassMap from "./ClassMap.vue";

const route = useRoute();
const { classes, loadClasses, saveClasses } = useClasses();

const showModal = ref(false);
const activeSeatingData = ref(null);
const activeSeatingMeta = ref(null);
const selectedSeatingDate = ref("");

const scale = ref(0.7);
const translateX = ref(0);
const translateY = ref(0);
const isPanning = ref(false);
const startX = ref(0);
const startY = ref(0);

const cls = computed(() =>
  classes.value.find((x) => String(x.id) === String(route.params.id))
);

const historyConfig = computed(() => {
  if (!cls.value) return {};
  const baseConfig = { ...cls.value.classConfig };
  if (activeSeatingMeta.value?.Rows)
    baseConfig.rows = activeSeatingMeta.value.Rows;
  if (activeSeatingMeta.value?.Columns)
    baseConfig.columns = activeSeatingMeta.value.Columns;
  return baseConfig;
});

const formatFullDate = (ts) => {
  if (!ts) return { date: "—", time: "" };
  const d = new Date(ts * 1000);
  return {
    date: d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  };
};

const openPreview = (seating) => {
  activeSeatingData.value = seating.Seating || [];
  activeSeatingMeta.value = seating;
  const fd = formatFullDate(seating.Date);
  selectedSeatingDate.value = `${fd.date} в ${fd.time}`;
  resetView();
  showModal.value = true;
};

const confirmDelete = (date) => {
  if (confirm("Удалить этот вариант рассадки из истории?")) {
    const classIdx = classes.value.findIndex(
      (c) => String(c.id) === String(route.params.id)
    );
    if (classIdx !== -1) {
      classes.value[classIdx].seatings = classes.value[
        classIdx
      ].seatings.filter((s) => s.Date !== date);
      saveClasses();
    }
  }
};

const canvasStyle = computed(() => ({
  transform: `translate3d(calc(-50% + ${translateX.value}px), calc(-50% + ${translateY.value}px), 0) scale(${scale.value})`,
  transformOrigin: "center center",
  position: "absolute",
  left: "50%",
  top: "50%",
  transition: isPanning.value
    ? "none"
    : "transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)",
  userSelect: "none",
}));

const zoomIn = () => (scale.value = Math.min(scale.value + 0.15, 3));
const zoomOut = () => (scale.value = Math.max(scale.value - 0.15, 0.1));
const resetView = () => {
  scale.value = 0.7;
  translateX.value = 0;
  translateY.value = 0;
};
const onWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  scale.value = Math.min(Math.max(scale.value + delta, 0.1), 3);
};
const startPan = (e) => {
  isPanning.value = true;
  startX.value = e.clientX - translateX.value;
  startY.value = e.clientY - translateY.value;
};
const panning = (e) => {
  if (!isPanning.value) return;
  translateX.value = e.clientX - startX.value;
  translateY.value = e.clientY - startY.value;
};
const endPan = () => (isPanning.value = false);

onMounted(loadClasses);
</script>

<style scoped>
.history-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.history-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
}

.variant-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.btn-view {
  background: #4f46e5;
  border: none;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #4338ca;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.canvas-viewport {
  width: 100%;
  height: 75vh;
  position: relative;
  overflow: hidden !important;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
  background-color: #f8fafc;
}

.grab-surface {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.grab-surface:active {
  cursor: grabbing;
}

.canvas-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  color: white;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.85rem;
  pointer-events: none;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.fade-in-up {
  animation: fadeInUp 0.5s ease backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hover-lift {
  transition: transform 0.2s;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

.btn-light-hover:hover {
  background-color: #f1f5f9;
}
</style>
