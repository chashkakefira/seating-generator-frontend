<template>
  <BApp>
    <BContainer fluid class="main-container p-0 h-100">
      <BRow class="h-100">
        <BCol
          md="3"
          lg="3"
          class="settings-panel bg-light border-end p-3 overflow-auto"
        >
          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Медицина</span>
              <span class="badge bg-primary fs-6">{{
                priorities.medical
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.medical"
              min="0"
              max="10"
              step="0.5"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Друзья вместе</span>
              <span class="badge bg-success fs-6">{{
                priorities.friends
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.friends"
              min="0"
              max="10"
              step="0.5"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Запрещенные пары</span>
              <span class="badge bg-danger fs-6">{{ priorities.enemies }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.enemies"
              min="0"
              max="10"
              step="0.5"
            />
          </div>

          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Предпочтения по рядам и партам</span>
              <span class="badge bg-warning fs-6">{{
                priorities.preferences
              }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.preferences"
              min="0"
              max="10"
              step="0.5"
            />
          </div>
          <div class="slider-group mb-4">
            <label
              class="form-label fw-bold mb-2 d-flex justify-content-between align-items-center"
            >
              <span>Плотность заполнения</span>
              <span class="badge bg-info fs-6">{{ priorities.fill }}</span>
            </label>
            <input
              type="range"
              class="form-range"
              v-model.number="priorities.fill"
              min="0"
              max="10"
              step="0.5"
            />
          </div>

          <div class="d-grid gap-2">
            <button
              class="btn btn-success btn-lg shadow fw-bold py-3 generate-btn"
              @click="handleGenerate"
              :disabled="isGenerating"
            >
              <span v-if="!isGenerating"
                ><i class="bi bi-magic me-2"></i>Рассадить!</span
              >
              <span v-else
                ><span class="spinner-border spinner-border-sm me-2"></span
                >Думаю...</span
              >
            </button>
          </div>

          <div
            v-if="validateErrors.length"
            class="alert alert-danger mt-3 small"
          >
            <ul v-if="validateErrors.length" class="mb-0 ps-3 mt-1">
              <li v-for="e in validateErrors" :key="e">{{ e }}</li>
            </ul>
          </div>
        </BCol>

        <BCol class="p-0 position-relative bg-secondary-subtle overflow-hidden">
          <div
            class="canvas-controls position-absolute top-0 end-0 m-3 btn-group shadow bg-white rounded z-3"
          >
            <button
              class="btn btn-light border"
              @click="zoomOut"
              title="Уменьшить"
            >
              -
            </button>
            <button
              class="btn btn-light border px-3"
              @click="resetView"
              title="Сброс"
            >
              100%
            </button>
            <button
              class="btn btn-light border"
              @click="zoomIn"
              title="Увеличить"
            >
              +
            </button>
          </div>
          <div
            class="position-absolute bottom-0 start-0 m-3 z-3 text-muted small user-select-none"
          >
            <i class="bi bi-arrows-move"></i> Тяните мышкой для перемещения
          </div>
          <div
            class="viewport w-100 h-100 d-flex align-items-center justify-content-center"
            ref="viewportRef"
            @mousedown="startPan"
            @mousemove="panning"
            @mouseup="endPan"
            @mouseleave="endPan"
            @wheel.prevent="onWheel"
          >
            <div :style="canvasStyle">
              <div
                class="blackboard bg-dark mt-2 mx-auto rounded d-flex align-items-center justify-content-center text-white mb-5"
              >
                ДОСКА
              </div>
              <div class="desks-container d-flex flex-column gap-4">
                <div
                  v-for="row in request.classConfig.rows"
                  :key="row"
                  class="desk-row d-flex gap-4 justify-content-center"
                >
                  <div
                    class="row-marker d-flex align-items-center justify-content-center text-muted fw-bold small"
                  >
                    {{ row }}
                  </div>
                  <div
                    v-for="col in request.classConfig.columns"
                    :key="col"
                    class="desk-unit shadow-sm bg-white rounded border d-flex overflow-hidden"
                    :class="request.classConfig.deskType"
                  >
                    <template v-if="request.classConfig.deskType === 'double'">
                      <div
                        class="seat flex-fill d-flex align-items-center justify-content-center p-1 border-end"
                        :title="getStudentName(row - 1, (col - 1) * 2)"
                        :style="
                          getSeatStyle(getSeatData(row - 1, (col - 1) * 2))
                        "
                      >
                        <span class="student-name" v-fit-text>{{
                          getStudentName(row - 1, (col - 1) * 2) || ""
                        }}</span>
                      </div>
                      <div
                        class="seat flex-fill d-flex align-items-center justify-content-center p-1"
                        :style="
                          getSeatStyle(getSeatData(row - 1, (col - 1) * 2 + 1))
                        "
                        :title="getStudentName(row - 1, (col - 1) * 2 + 1)"
                      >
                        <span class="student-name" v-fit-text>{{
                          getStudentName(row - 1, (col - 1) * 2 + 1) || ""
                        }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div
                        class="seat flex-fill d-flex align-items-center justify-content-center p-1 position-relative"
                        :class="{
                          'bg-warning-subtle': isIgnored(row, col - 1),
                        }"
                        :title="getStudentName(row - 1, col - 1)"
                      >
                        <span class="student-name small fw-medium" v-fit-text>{{
                          getStudentName(row - 1, col - 1) || ""
                        }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BCol>
      </BRow>
    </BContainer>
  </BApp>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useSeating } from "./composables/useSeating";
import useClasses from "./composables/useClasses";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
const { classes, loadClasses } = useClasses();
const {
  request,
  ignored,
  error,
  validateErrors,
  response,
  generateSeating,
  getStudentName,
  getStudentID,
  priorities,
} = useSeating();

const isGenerating = ref(false);

onMounted(async () => {
  await loadClasses();
  const classId = route.params.id;
  const targetClass = classes.value.find((c) => c.id == classId);
  if (!targetClass) {
    alert("Класс не найден!");
    router.push("/");
    return;
  }
  if (targetClass.classConfig) {
    request.value.classConfig = JSON.parse(
      JSON.stringify(targetClass.classConfig)
    );
  }

  if (targetClass.students) {
    request.value.students = JSON.parse(JSON.stringify(targetClass.students));
  }

  if (targetClass.preferences)
    request.value.preferences = JSON.parse(
      JSON.stringify(targetClass.preferences)
    );
  if (targetClass.forbidden)
    request.value.forbidden = JSON.parse(JSON.stringify(targetClass.forbidden));

  console.log(`Класс ${targetClass.name} загружен в генератор`);
});

const handleGenerate = async () => {
  if (validateErrors.value.length > 0) {
    error.value = "Исправьте ошибки ввода перед генерацией";
    return;
  }
  isGenerating.value = true;
  try {
    await generateSeating();
  } finally {
    isGenerating.value = false;
  }
};
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isPanning = ref(false);
const startX = ref(0);
const startY = ref(0);

const canvasStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: "center center",
  transition: isPanning.value
    ? "none"
    : "transform 0.2s cubic-bezier(0.25, 0.8, 0.5, 1)",
}));

const zoomIn = () => (scale.value = Math.min(scale.value + 0.15, 2.5));
const zoomOut = () => (scale.value = Math.max(scale.value - 0.15, 0.4));
const resetView = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

const onWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  scale.value = Math.min(Math.max(scale.value + delta, 0.4), 2.5);
};

const startPan = (e) => {
  isPanning.value = true;
  startX.value = e.clientX - translateX.value;
  startY.value = e.clientY - translateY.value;
  e.currentTarget.style.cursor = "grabbing";
};
const panning = (e) => {
  if (!isPanning.value) return;
  translateX.value = e.clientX - startX.value;
  translateY.value = e.clientY - startY.value;
};
const endPan = (e) => {
  isPanning.value = false;
  if (e.currentTarget) e.currentTarget.style.cursor = "grab";
};

const isIgnored = (row, colIndex) =>
  ignored.value.includes(getStudentID(row - 1, colIndex));

const vFitText = {
  mounted: (el) => adjustFontSize(el),
  updated: (el) => adjustFontSize(el),
};

const adjustFontSize = (el) => {
  const maxFontSize = 14;
  const minFontSize = 9;

  el.style.fontSize = maxFontSize + "px";
  el.style.lineHeight = "1.1";
  el.style.textOverflow = "clip";
  el.style.overflow = "visible";

  let currentSize = maxFontSize;

  while (el.scrollWidth > el.clientWidth && currentSize > minFontSize) {
    currentSize--;
    el.style.fontSize = currentSize + "px";
  }

  if (el.scrollWidth > el.clientWidth) {
    el.style.overflow = "hidden";
    el.style.textOverflow = "ellipsis";
  } else {
    el.style.overflow = "hidden";
    el.style.textOverflow = "clip";
  }
};
const getSeatData = (row, col) => {
  return response.value.find((s) => s.Row === row && s.Column === col);
};
const getSeatStyle = (seat) => {
  if (!seat || seat.StudentID === -1 || !seat.Student) {
    return { backgroundColor: "transparent" };
  }

  const level = seat.Satisfaction?.Level ?? 0.5;
  const hue = level * 120;

  return {
    backgroundColor: `hsl(${hue}, 85%, 92%)`,
    color: `hsl(${hue}, 90%, 15%)`,
    transition: "all 0.5s ease",
  };
};
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.generate-btn {
  transition: all 0.2s;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 135, 84, 0.4);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.viewport {
  cursor: grab;
  background-color: rgb(223, 223, 223);
}

.classroom-canvas {
  background: white;
  padding: 60px 100px;
  border-radius: 8px;
  min-width: 800px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seat {
  width: 110px;
  min-width: 0;
  overflow: hidden;
}

.teacher-desk {
  width: 240px;
  height: 70px;
  background: #475569;
  color: #f8fafc;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.blackboard {
  width: 300px;
  height: 40px;
  background: #334155;
}

.desk-unit {
  transition: all 0.3s;
}

.desk-unit.single {
  width: 110px;
  height: 65px;
}

.desk-unit.double {
  width: 220px;
  height: 65px;
}

.form-select-xs {
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
}
.student-name {
  max-width: 100%;
  display: block;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
