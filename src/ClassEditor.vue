<template>
  <div class="p-3" v-if="cls">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div class="d-flex align-items-center gap-3">
        <BButton variant="outline-secondary" @click="$router.back()"
          >&larr;</BButton
        >
        <h2 class="m-0">{{ cls.name }}</h2>
      </div>
    </div>

    <BTabs content-class="mt-3">
      <BTab title="Ученики" active>
        <div class="mb-2">
          <BButton variant="success" @click="addStudent"
            >+ Добавить ученика</BButton
          >
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-striped align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 25%">Имя</th>
                <th>Предпочитаемые ряды</th>
                <th>Предпочитаемые парты</th>
                <th class="text-danger">Медицинские ряды</th>
                <th class="text-danger">Медицинские парты</th>
                <th style="width: 50px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, index) in cls.students" :key="index">
                <td>
                  <BFormInput
                    v-model="student.name"
                    size="sm"
                    placeholder="Имя"
                  />
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <BFormInput v-model="student.preferredRows" size="sm" />
                    <BButton
                      size="sm"
                      variant="outline-primary"
                      @click="openVisualizer(student, 'prefs')"
                      >🗺️</BButton
                    >
                  </div>
                </td>
                <td>
                  <BFormInput v-model="student.preferredColumns" size="sm" />
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <BFormInput
                      v-model="student.medicalPreferredRow"
                      size="sm"
                    />
                    <BButton
                      size="sm"
                      variant="outline-danger"
                      @click="openVisualizer(student, 'medical')"
                      >🏥</BButton
                    >
                  </div>
                </td>
                <td>
                  <BFormInput
                    v-model="student.medicalPreferredColumn"
                    size="sm"
                  />
                </td>
                <td>
                  <BButton
                    size="sm"
                    variant="outline-danger"
                    @click="cls.students.splice(index, 1)"
                    >&times;</BButton
                  >
                </td>
              </tr>
              <tr v-if="!cls.students?.length">
                <td colspan="6" class="text-center text-muted p-3">
                  Список пуст. Нажмите "Добавить ученика"
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BTab>

      <BTab title="Параметры класса">
        <BCard style="max-width: 30rem">
          <BFormGroup label="Имя класса">
            <BFormInput v-model="cls.name"></BFormInput>
          </BFormGroup>
          <BFormGroup label="Количество рядов">
            <BFormInput type="number" v-model.number="cls.classConfig.rows" />
          </BFormGroup>
          <BFormGroup label="Парт в ряду">
            <BFormInput
              type="number"
              v-model.number="cls.classConfig.columns"
            />
          </BFormGroup>
          <BFormGroup label="Тип парт">
            <BFormSelect
              v-model="cls.classConfig.deskType"
              :options="[
                { value: 'double', text: 'Двойные' },
                { value: 'single', text: 'Одинарные' },
              ]"
            />
          </BFormGroup>
        </BCard>
      </BTab>
    </BTabs>

    <BModal
      v-model="showVisualizer"
      title="Выбор мест"
      size="lg"
      @ok="saveVisualSelection"
    >
      <div class="d-flex flex-column align-items-center gap-3">
        <div class="bg-dark text-white rounded p-1 w-50 text-center mb-2">
          ДОСКА
        </div>
        <div
          v-for="r in cls.classConfig.rows"
          :key="r"
          class="d-flex align-items-center gap-3"
        >
          <button
            class="btn btn-sm"
            :class="
              selection.rows.includes(r)
                ? 'btn-primary'
                : 'btn-outline-secondary'
            "
            @click="
              selection.rows.includes(r)
                ? selection.rows.splice(selection.rows.indexOf(r), 1)
                : selection.rows.push(r)
            "
            style="width: 80px"
          >
            {{ r }}
          </button>
          <div class="d-flex gap-2">
            <div
              v-for="c in cls.classConfig.columns"
              :key="c"
              class="d-flex align-items-center justify-content-center border rounded"
              :class="
                selection.cols.includes(c)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-light text-secondary border-secondary'
              "
              @click="
                selection.cols.includes(c)
                  ? selection.cols.splice(selection.cols.indexOf(c), 1)
                  : selection.cols.push(c)
              "
              style="width: 40px; height: 40px; cursor: pointer"
            >
              {{ c }}
            </div>
          </div>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, ref } from "vue";
import { useRoute } from "vue-router";
import useClasses from "./composables/useClasses.js";
import {
  BApp,
  BButton,
  BTabs,
  BTab,
  BCard,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BModal,
} from "bootstrap-vue-next";

const route = useRoute();
const { classes, saveClasses, loadClasses } = useClasses();
const showVisualizer = ref(false);
const currentStudent = ref(null);
const editMode = ref("");
const selection = ref({ rows: [], cols: [] });

const cls = computed(() => {
  const c = classes.value.find((x) => x.id == route.params.id);
  if (c) {
    if (!c.students) c.students = [];
    if (!c.classConfig)
      c.classConfig = { rows: 3, columns: 2, deskType: "double" };
  }
  return c;
});

const addStudent = () => {
  cls.value.students.push({
    id: Date.now(),
    name: "",
    preferredRows: "",
    preferredColumns: "",
    medicalPreferredRow: "",
    medicalPreferredColumn: "",
  });
};

const openVisualizer = (student, mode) => {
  currentStudent.value = student;
  editMode.value = mode;
  const str =
    mode === "prefs"
      ? student.preferredRows + "|" + student.preferredColumns
      : student.medicalPreferredRow + "|" + student.medicalPreferredColumn;
  selection.value.rows = str
    .split("|")[0]
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
  selection.value.cols = str
    .split("|")[1]
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
  showVisualizer.value = true;
};

const saveVisualSelection = () => {
  if (!currentStudent.value) return;
  const rRes = selection.value.rows.sort((a, b) => a - b).join(", ");
  const cRes = selection.value.cols.sort((a, b) => a - b).join(", ");
  if (editMode.value === "prefs") {
    currentStudent.value.preferredRows = rRes;
    currentStudent.value.preferredColumns = cRes;
  } else {
    currentStudent.value.medicalPreferredRow = rRes;
    currentStudent.value.medicalPreferredColumn = cRes;
  }
};

onMounted(() => loadClasses());
watch(classes, () => saveClasses(), { deep: true });
</script>
