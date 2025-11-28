<template>
  <BApp>
    <div
      class="app-header bg-primary text-white p-3 shadow-sm mb-3 d-flex justify-content-between align-items-center"
    >
      <h1 class="h4 m-0">
        <i class="bi bi-grid-3x3-gap-fill me-2"></i>Генератор школьной рассадки
      </h1>
      <div
        v-if="response.length > 0"
        class="fitness-badge bg-white text-primary px-3 py-1 rounded-pill fw-bold"
      >
        <i class="bi bi-trophy-fill me-1 text-warning"></i> Качество:
        {{ fitness }}
      </div>
    </div>

    <BContainer fluid class="main-container">
      <BRow class="h-100">
        <BCol
          md="3"
          lg="3"
          class="settings-panel bg-light border-end p-3 overflow-auto"
          style="max-height: 92vh"
        >
          <h5 class="mb-3 text-muted">Конфигурация</h5>
          <div class="card shadow-sm mb-3">
            <div class="card-body p-3">
              <div class="mb-3">
                <label class="form-label small fw-bold">Размер класса</label>
                <div class="d-flex gap-2">
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">Ряды</small>
                    <input
                      v-model.number="request.classConfig.rows"
                      type="number"
                      class="form-control form-control-sm"
                      min="1"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <small class="text-muted d-block">Парты</small>
                    <input
                      v-model.number="request.classConfig.columns"
                      type="number"
                      class="form-control form-control-sm"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              <div class="mb-0">
                <label class="form-label small fw-bold">Парты</label>
                <select
                  v-model="request.classConfig.deskType"
                  class="form-select form-select-sm"
                >
                  <option value="single">Одиночные</option>
                  <option value="double">Двойные</option>
                </select>
              </div>
            </div>
          </div>

          <BAccordion class="mb-3 shadow-sm" flush>
            <BAccordionItem title="⚙️ Алгоритм и Приоритеты">
              <div class="p-1">
                <label class="small text-muted mt-2"
                  >Приоритеты (Сверху = важнее)</label
                >
                <draggable
                  v-model="request.priority"
                  item-key="element => element"
                  class="list-group"
                >
                  <template #item="{ element }">
                    <div
                      class="drag-item list-group-item d-flex align-items-center mb-1 p-2"
                    >
                      <span class="handle me-2" style="cursor: grab"
                        >&#9776;</span
                      >
                      <span>{{ accordionItems[element] }}</span>
                    </div>
                  </template>
                </draggable>
                <hr class="my-2" />
                <label class="small text-muted">Точность (Популяция)</label>
                <input
                  v-model.number="request.popSize"
                  type="number"
                  class="form-control form-control-sm mb-2"
                />
                <label class="small text-muted">Поколения</label>
                <input
                  v-model.number="request.generations"
                  type="number"
                  class="form-control form-control-sm mb-2"
                />
                <label class="small text-muted">Мутация (0-1)</label>
                <input
                  v-model.number="request.crossOverChance"
                  type="number"
                  step="0.1"
                  class="form-control form-control-sm"
                />
              </div>
            </BAccordionItem>
          </BAccordion>

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
            <button class="btn btn-outline-danger btn-sm" @click="clearData">
              <i class="bi bi-trash me-1"></i>Сброс
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

        <BCol
          md="6"
          lg="6"
          class="p-0 position-relative bg-secondary-subtle overflow-hidden"
        >
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
            class="position-absolute bottom-0 start-0 m-3 z-0 text-muted small user-select-none"
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
              <div class="teacher-area mb-5 text-center">
                <div
                  class="teacher-desk shadow-sm rounded mx-auto d-flex align-items-center justify-content-center text-white fw-bold"
                >
                  СТОЛ УЧИТЕЛЯ
                </div>
                <div class="blackboard bg-dark mt-2 mx-auto rounded"></div>
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
                        :class="{
                          'bg-warning-subtle': isIgnored(row, (col - 1) * 2),
                        }"
                        :title="getStudentName(row - 1, (col - 1) * 2)"
                      >
                        <span class="student-name" v-fit-text>{{
                          getStudentName(row - 1, (col - 1) * 2) || ""
                        }}</span>
                      </div>
                      <div
                        class="seat flex-fill d-flex align-items-center justify-content-center p-1"
                        :class="{
                          'bg-warning-subtle': isIgnored(
                            row,
                            (col - 1) * 2 + 1
                          ),
                        }"
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

        <BCol
          md="3"
          lg="3"
          class="data-panel bg-white border-start p-0 d-flex flex-column overflow-auto"
          style="height: 92vh"
        >
          <BTabs content-class="mt-3">
            <div
              class="tab-content flex-grow-1 overflow-hidden d-flex flex-column"
            >
              <BTab title="Ученки" active class="overflow-hidden">
                <div class="p-2 border-bottom bg-light">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text">
                      <iBiSearch />
                    </span>
                    <input
                      v-model="studentSearch"
                      class="form-control"
                      placeholder="Поиск..."
                    />
                    <button class="btn btn-primary" @click="addStudent">
                      <iBiPersonFillAdd />
                    </button>
                  </div>
                </div>
                <div class="overflow-hidden flex-grow-1 p-2">
                  <BPagination
                    v-model="currentPage"
                    :total-rows="filteredStudents.length"
                    :per-page="perPage"
                    size="sm"
                    class="justify-content-center mt-2"
                  />
                  <div
                    v-for="student in paginatedStudents"
                    :key="student.id"
                    class="student-card card mb-2 shadow-sm border-0"
                  >
                    <div
                      class="card-body p-2 d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div
                          class="fw-bold text-truncate"
                          style="max-width: 140px"
                        >
                          {{ student.name || "Без имени" }}
                        </div>
                        <small class="text-muted" v-if="student.preferredRows"
                          >Ряд: {{ student.preferredRows }}</small
                        >
                      </div>
                      <div class="btn-group btn-group-sm">
                        <button
                          class="btn btn-light text-primary"
                          @click="openEditModal(student)"
                        >
                          <IBiPencil />
                        </button>
                        <button
                          class="btn btn-light text-danger"
                          @click="removeStudent(student.id)"
                        >
                          <iBiTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </BTab>
              <BTab title="Предпочтения" class="p-2">
                <h6 class="fw-bold text-success">
                  <i class="bi bi-heart-fill me-1"></i>Предпочтения
                </h6>
                <div
                  v-for="(pref, i) in request.preferences"
                  :key="'p' + i"
                  class="card mb-2 bg-success-subtle border-0"
                >
                  <div class="card-body p-2 d-flex gap-1 align-items-center">
                    <input
                      class="form-control form-control-sm border-0"
                      v-model="preferencesDisplay[i][0]"
                      placeholder="Кто"
                      @blur="
                        updateIdFromName(
                          'preferences',
                          i,
                          0,
                          $event.target.value
                        )
                      "
                      list="s-list"
                    />
                    <span>+</span>
                    <input
                      class="form-control form-control-sm border-0"
                      v-model="preferencesDisplay[i][1]"
                      placeholder="С кем"
                      @blur="
                        updateIdFromName(
                          'preferences',
                          i,
                          1,
                          $event.target.value
                        )
                      "
                      list="s-list"
                    />
                    <button
                      class="btn btn-sm text-danger"
                      @click="removePreference(i)"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-outline-success w-100 mb-4"
                  @click="addPreference"
                >
                  + Добавить пару
                </button>
                <h6 class="fw-bold text-danger">
                  <i class="bi bi-slash-circle-fill me-1"></i>Запреты
                </h6>
                <div
                  v-for="(forb, i) in request.forbidden"
                  :key="'f' + i"
                  class="card mb-2 bg-danger-subtle border-0"
                >
                  <div class="card-body p-2 d-flex gap-1 align-items-center">
                    <input
                      class="form-control form-control-sm border-0"
                      v-model="forbiddenDisplay[i][0]"
                      placeholder="Кто"
                      @blur="
                        updateIdFromName('forbidden', i, 0, $event.target.value)
                      "
                      list="s-list"
                    />
                    <span>≠</span>
                    <input
                      class="form-control form-control-sm border-0"
                      v-model="forbiddenDisplay[i][1]"
                      placeholder="С кем"
                      @blur="
                        updateIdFromName('forbidden', i, 1, $event.target.value)
                      "
                      list="s-list"
                    />
                    <button
                      class="btn btn-sm text-danger"
                      @click="removeForbidden(i)"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <button
                  class="btn btn-sm btn-outline-danger w-100"
                  @click="addForbidden"
                >
                  + Добавить запрет
                </button>
                <datalist id="s-list">
                  <option
                    v-for="s in request.students"
                    :value="s.name"
                  ></option>
                </datalist>
              </BTab>
            </div>
          </BTabs>
        </BCol>
      </BRow>
    </BContainer>

    <BModal
      v-model="showModal"
      :title="editingStudent ? 'Изменить ученика' : 'Новый ученик'"
      @ok="saveStudent"
      centered
    >
      <BForm>
        <BFormGroup label="Имя и Фамилия" class="mb-3">
          <BFormInput v-model="modalStudent.name" required />
        </BFormGroup>
        <BRow>
          <BCol>
            <BFormGroup label="Желаемые ряды">
              <BFormInput
                v-model="modalStudent.preferredRows"
                placeholder="1, 2"
              />
            </BFormGroup>
          </BCol>
          <BCol>
            <BFormGroup label="Желаемые парты">
              <BFormInput
                v-model="modalStudent.preferredColumns"
                placeholder="1, 3"
              />
            </BFormGroup>
          </BCol>
        </BRow>
        <BRow class="mt-2">
          <BCol>
            <BFormGroup label="Медиц. ряды">
              <BFormInput
                v-model="modalStudent.medicalPreferredRow"
                placeholder="Только 1"
              />
            </BFormGroup>
          </BCol>
          <BCol>
            <BFormGroup label="Медиц. парты">
              <BFormInput v-model="modalStudent.medicalPreferredColumn" />
            </BFormGroup>
          </BCol>
        </BRow>
      </BForm>
    </BModal>
  </BApp>
</template>

<script setup>
import { ref, computed } from "vue";
import { useSeating } from "./composables/useSeating";
import draggable from "vuedraggable";

const {
  request,
  response,
  fitness,
  ignored,
  error,
  validateErrors,
  studentSearch,
  paginatedStudents,
  filteredStudents,
  currentPage,
  perPage,
  showModal,
  modalStudent,
  editingStudent,
  studentFields,
  validateName,
  generateSeating,
  getStudentName,
  getStudentID,
  clearData,
  openEditModal,
  removeStudent,
  addStudent,
  saveStudent,
  accordionItems,
  onDragEnd,
  preferencesDisplay,
  forbiddenDisplay,
  addPreference,
  removePreference,
  addForbidden,
  removeForbidden,
  updateIdFromName,
} = useSeating();

const isGenerating = ref(false);

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
  height: 10px;
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
