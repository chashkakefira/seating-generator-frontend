<template>

  <body>
    <BApp>
      <h1>Генератор школьной рассадки</h1>
      <BContainer class="mt-3 mb-3" fluid>
        <BRow>
          <BCol sm="10" md="2">
            <h3>Конфигурация класса</h3>
            <div class="mb-3">
              <label>Ряды:</label>
              <input v-model.number="request.classConfig.columns" type="number" class="form-control" required />
            </div>
            <div class="mb-3">
              <label>Парт в ряду:</label>
              <input v-model.number="request.classConfig.rows" type="number" class="form-control" required />
            </div>
            <div class="mb-3">
              <label>Тип парт:</label>
              <select v-model="request.classConfig.deskType" class="form-control">
                <option value="single">Одиночные</option>
                <option value="double">Двойные</option>
              </select>
            </div>
            <BAccordion>
              <BAccordionItem title="Настройки генетического алгоритма">
                <p>Приоритеты параметров оценивания (от наивысшего к наименьшему):</p>
                <div class="input-group mb-2">
                  <select v-model="request.priority[3]" class="form-control">
                    <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                      {{ pr }}
                    </option>
                  </select>
                </div>
                <div class="input-group mb-2">
                  <select v-model="request.priority[2]" class="form-control">
                    <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                      {{ pr }}
                    </option>
                  </select>
                </div>
                <div class="input-group mb-2">
                  <select v-model="request.priority[1]" class="form-control">
                    <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                      {{ pr }}
                    </option>
                  </select>
                </div>
                <div class="input-group mb-2">
                  <select v-model="request.priority[0]" class="form-control">
                    <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                      {{ pr }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label>Размер популяции</label>
                  <input v-model.number="request.popSize" type="number" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label>Количество поколений</label>
                  <input v-model.number="request.generations" type="number" class="form-control" required />
                </div>
                <div class="mb-3">
                  <label>Шанс кроссинговера</label>
                  <input v-model.number="request.crossOverChance" type="number" step="0.1" class="form-control"
                    required />
                </div>
              </BAccordionItem>
            </BAccordion>
            <button type="button" class="btn btn-success mt-3" @click="generateSeating">Сгенерировать рассадку</button>
            <button type="button" class="btn btn-warning mt-3" @click="clearData">Очистить данные</button>
            <div v-if="error" class="alert alert-danger mt-3">
              {{ error }}
              <div v-if="validateErrors.length > 0" class="alert alert-danger mt-3">
                <p v-for="error in validateErrors" :key="error">{{ error }}</p>
              </div>
            </div>
          </BCol>
          <BCol sm="12" md="6">
            <div v-if="response.length > 0" class="mt-4">
              <h3>Результат рассадки</h3>
              <p>Баллов набрано: {{ fitness }}</p>
            </div>
            <h4>Визуализация</h4>
            <div v-if="request.classConfig.deskType === 'double'" class="classroom">
              <div class="row header-row">
                <div class="seat-label"></div>
                <div v-for="col in request.classConfig.columns * 2" :key="'header-' + col" class="seat-label"
                  :class="{ 'double-desk': col % 2 === 0 }">
                  {{ col }}
                </div>
              </div>
              <div v-for="row in request.classConfig.rows" :key="row" class="row">
                <div class="seat-label">{{ row }}</div>
                <div v-for="col in request.classConfig.columns * 2" :key="col" class="seat"
                  :class="{ 'double-desk': request.classConfig.deskType === 'double' && col % 2 === 0, 'ignored': ignored.includes(getStudentID(row - 1, col - 1)) }">
                  {{ getStudentName(row - 1, col - 1) || '-' }}
                </div>
              </div>
            </div>
            <div v-else class="classroom">
              <div class="row header-row">
                <div class="seat-label single-desk"></div>
                <div v-for="col in request.classConfig.columns" :key="'header-' + col" class="seat-label single-desk">
                  {{ col }}
                </div>
              </div>
              <div v-for="row in request.classConfig.rows" :key="row" class="row">
                <div class="seat-label single-desk">{{ row }}</div>
                <div v-for="col in request.classConfig.columns" :key="col" class="seat single-desk"
                  :class="{ 'ignored': ignored.includes(getStudentID(row - 1, col - 1)) }">
                  {{ getStudentName(row - 1, col - 1) || '-' }}
                </div>
              </div>
            </div>
          </BCol>
          <BCol sm="8" md="4" class="p-2" style="overflow: auto; max-height: 90vh;">
            <h3>Ученики</h3>
            <BFormInput v-model="studentSearch" placeholder="Поиск по имени" class="mb-3" />
            <BTable :items="paginatedStudents" :fields="studentFields" striped responsive>
              <template #cell(actions)="row">
                <BButton size="sm" variant="primary" @click="openEditModal(row.item)">Редактировать</BButton>
                <BButton size="sm" variant="danger" @click="removeStudent(row.index)">Удалить</BButton>
              </template>
            </BTable>
            <BPagination v-model="currentPage" :total-rows="filteredStudents.length" :per-page="perPage" class="mt-3" />
            <BButton type="button" class="btn btn-primary mb-3" @click="addStudent">Добавить ученика</BButton>
            <BModal v-model="showModal" :title="editingStudent ? 'Редактировать ученика' : 'Добавить ученика'"
              ok-title="Сохранить" cancel-title="Отмена" @ok="saveStudent">
              <BForm>
                <BFormGroup label="Имя ученика" :state="validateName(modalStudent.name)">
                  <BFormInput v-model="modalStudent.name" required />
                  <BFormInvalidFeedback>Имя не может быть пустым</BFormInvalidFeedback>
                </BFormGroup>
                <BFormGroup label="Предпочитаемые ряды (через запятую)">
                  <BFormInput v-model="modalStudent.preferredRows" />
                </BFormGroup>
                <BFormGroup label="Предпочитаемые парты (через запятую)">
                  <BFormInput v-model="modalStudent.preferredColumns" />
                </BFormGroup>
                <BFormGroup label="Медицинские ряды (через запятую)">
                  <BFormInput v-model="modalStudent.medicalPreferredRow" />
                </BFormGroup>
                <BFormGroup label="Медицинские парты (через запятую)">
                  <BFormInput v-model="modalStudent.medicalPreferredColumn" />
                </BFormGroup>
              </BForm>
            </BModal>
            <h3>Предпочтения</h3>
            <div v-for="(pref, index) in request.preferences" :key="'pref-' + index" class="input-group mb-2">
              <select v-model="pref[0]" class="form-control">
                <option v-for="student in request.students" :value="student.id">
                  {{ student.name || `Ученик ${student.id}` }}
                </option>
              </select>
              <select v-model="pref[1]" class="form-control">
                <option v-for="student in request.students" :value="student.id">
                  {{ student.name || `Ученик ${student.id}` }}
                </option>
              </select>
              <button type="button" class="btn btn-danger"
                @click="request.preferences.splice(index, 1)">Удалить</button>
            </div>
            <button type="button" class="btn btn-primary mb-3" @click="request.preferences.push([0, 1])">Добавить
              предпочтение</button>
            <h3>Запрещённые пары</h3>
            <div v-for="(forb, index) in request.forbidden" :key="'forb-' + index" class="input-group mb-2">
              <select v-model="forb[0]" class="form-control">
                <option v-for="student in request.students" :value="student.id">
                  {{ student.name || `Ученик ${student.id}` }}
                </option>
              </select>
              <select v-model="forb[1]" class="form-control">
                <option v-for="student in request.students" :value="student.id">
                  {{ student.name || `Ученик ${student.id}` }}
                </option>
              </select>
              <button type="button" class="btn btn-danger" @click="request.forbidden.splice(index, 1)">Удалить</button>
            </div>
            <button type="button" class="btn btn-primary mb-3" @click="request.forbidden.push([0, 1])">Добавить
              запрет</button>
          </BCol>
        </BRow>
      </BContainer>
      <router-view />
    </BApp>
  </body>
</template>

<script>
import { BApp } from 'bootstrap-vue-next';
import axios from 'axios';

export default {
  data() {
    return {
      request: {
        students: [
          {
            id: 0,
            name: 'Алекс',
            preferredRows: '1',
            preferredColumns: '1',
            medicalPreferredRow: '1',
            medicalPreferredColumn: '',
          },
          {
            id: 1,
            name: 'Иван',
            preferredRows: '',
            preferredColumns: '',
            medicalPreferredRow: '',
            medicalPreferredColumn: '',
          },
          {
            id: 2,
            name: 'Анна',
            preferredRows: '',
            preferredColumns: '',
            medicalPreferredRow: '',
            medicalPreferredColumn: '',
          },
        ],
        preferences: [[0, 1]],
        forbidden: [[0, 2]],
        classConfig: {
          rows: 2,
          columns: 2,
          deskType: 'double',
        },
        priority: [3, 2, 1, 0],
        popSize: 300,
        generations: 400,
        crossOverChance: 0.3,
      },
      preferencesInput: [0, 1],
      forbiddenInput: [0, 1],
      response: [],
      error: '',
      validateErrors: [],
      ignored: [],
      priorities: ['Медицинские парты и ряды', 'Предпочитаемые парты и ряды', 'Запрещенные пары', 'Предпочтения учеников по парам'],
      savedSeatings: [],
      chosenIndex: 0,
      chosenStudentID: null,
      studentSearch: '',
      currentPage: 1,
      perPage: 3,
      showModal: false,
      editingStudent: null,
      modalStudent: { name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' },
      studentFields: [
        { key: 'name', label: 'Имя' },
        { key: 'preferredRows', label: 'Предпочт. ряды' },
        { key: 'preferredColumns', label: 'Предпочт. парты' },
        { key: 'medicalPreferredRow', label: 'Мед. ряды' },
        { key: 'medicalPreferredColumn', label: 'Мед. парты' },
        { key: 'actions', label: 'Действия' }
      ]
    };
  },
  computed: {
    filteredStudents() {
      return this.request.students.filter(student =>
        student.name.toLowerCase().includes(this.studentSearch.toLowerCase())
      );
    },
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.perPage;
      const end = start + this.perPage;
      return this.filteredStudents.slice(start, end);
    },
  },
  created() {
    const savedData = localStorage.getItem('seatingRequest');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      this.request = {
        ...parsedData,
        students: parsedData.students || [],
        preferences: parsedData.preferences || [],
        forbidden: parsedData.forbidden || [],
        classConfig: parsedData.classConfig || this.request.classConfig,
        popSize: parsedData.popSize || 300,
        generations: parsedData.generations || 400,
        crossOverChance: parsedData.crossOverChance || 0.3,
        priority: parsedData.priority || [3, 2, 1, 0],
      };
    }
  },
  methods: {
    validateInput() {
      const error = [];
      const { students, preferences, forbidden, classConfig } = this.request;

      if (classConfig.rows <= 0) {
        error.push('Количество парт в ряду должно быть положительным целым числом');
      }
      if (classConfig.columns <= 0) {
        error.push('Количество рядов должно быть целым положительным числом');
      }
      const studentsIDs = new Map();
      students.forEach((student, index) => {
        studentsIDs.set(student.id, student.name);
        this.parseCommaSeparated(student.preferredRows).forEach((row) => {
          if (row < 0 || row >= classConfig.rows) {
            error.push(`Недопустимый ряд ${row} для ученика ${student.name}`);
          }
        });
        this.parseCommaSeparated(student.preferredColumns).forEach((col) => {
          if (col < 0 || col >= (classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns)) {
            error.push(`Недопустимая парта ${col} для ученика ${student.name}`);
          }
        });
        this.parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
          if (col < 0 || col >= (classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns)) {
            error.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`);
          }
        });
        this.parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
          if (row < 0 || row >= classConfig.rows) {
            error.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`);
          }
        });
      });
      preferences.forEach((pair) => {
        if (pair[0] === pair[1]) {
          error.push(`${studentsIDs.get(pair[0])} не может хотеть сидеть сам с собой`);
        }
      });
      forbidden.forEach((pair) => {
        if (pair[0] === pair[1]) {
          error.push(`${studentsIDs.get(pair[0])} не может не сидеть сам с собой`);
        }
      });
      const preferencePairs = new Set(preferences.map((pair) => `${pair[0]},${pair[1]}`));
      forbidden.forEach((pair) => {
        const key = `${pair[0]},${pair[1]}`;
        if (preferencePairs.has(key)) {
          error.push(`Конфликт между предпочтительными и запрещенными парами: пара ${studentsIDs.get(pair[0])},${studentsIDs.get(pair[1])}`);
        }
      });
      if (this.request.popSize < 2 || this.request.popSize > 600) {
        error.push('Размер популяции должен быть целым положительным числом не меньше 2 и не больше 600');
      }
      if (this.request.generations < 2 || this.request.generations > 600) {
        error.push('Количество поколений должно быть целым положительным числом не меньше 2 и не больше 600');
      }
      if (this.request.crossOverChance < 0 || this.request.crossOverChance > 1) {
        error.push('Шанс кроссинговера должен лежать в диапазоне (0, 1]');
      }
      if (!this.areAllElementsUnique(this.request.priority)) {
        error.push('Повторяющиеся элементы в приоритетах параметров оценивания');
      }
      return error;
    },
    addStudent() {
      this.editingStudent = null;
      this.modalStudent = { name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' };
      this.showModal = true;
    },
    removeStudent(index) {
      this.request.students.splice(index, 1);
      this.request.students.forEach((student, i) => {
        student.id = i;
      });
    },
    parseCommaSeparated(str) {
      if (!str) return [];
      return str.split(',').map(Number).filter((n) => !isNaN(n)).map((n) => n - 1);
    },
    async generateSeating() {
      this.closeAll();
      this.error = '';
      const validationErrors = this.validateInput();
      if (validationErrors.length) {
        this.error = 'Найдены ошибки во входных данных:';
        this.validateErrors = validationErrors;
        return;
      }
      this.response = [];

      const requestData = {
        students: this.request.students.map((student) => ({
          id: student.id,
          name: student.name,
          preferredRows: this.parseCommaSeparated(student.preferredRows),
          preferredColumns: this.parseCommaSeparated(student.preferredColumns),
          medicalPreferredRows: this.parseCommaSeparated(student.medicalPreferredRow),
          medicalPreferredColumns: this.parseCommaSeparated(student.medicalPreferredColumn),
        })),
        preferences: this.request.preferences,
        forbidden: this.request.forbidden,
        classConfig: {
          rows: this.request.classConfig.rows,
          columns: this.request.classConfig.deskType === 'double' ? this.request.classConfig.columns * 2 : this.request.classConfig.columns,
        },
        popSize: this.request.popSize,
        generations: this.request.generations,
        crossOverChance: this.request.crossOverChance,
        priority: this.request.priority,
      };

      try {
        const res = await axios.post(import.meta.env.VITE_API_URL || 'http://localhost:5000', requestData, {
          headers: { 'Content-Type': 'application/json' },
        });
        this.response = res.data.Seating || [];
        this.fitness = res.data.Fitness || 0;
        this.ignored = res.data.Ignored || [];
      } catch (err) {
        this.error = err.response?.data || 'Ошибка при генерации рассадки';
      }
    },
    getStudentName(row, col) {
      const seat = this.response.find((s) => s.Row === row && s.Column === col);
      return seat ? seat.Student : '-';
    },
    getStudentID(row, col) {
      const seat = this.response.find((s) => s.Row === row && s.Column === col);
      return seat ? seat.StudentID : '-';
    },
    areAllElementsUnique(arr) {
      return new Set(arr).size === arr.length;
    },
    newSeating() {
      const seatingData = {
        timestamp: new Date().toISOString(),
        request: JSON.parse(JSON.stringify(this.request)),
        response: [...this.response],
        fitness: this.fitness,
        ignored: [...this.ignored],
      };
      this.savedSeatings.push(seatingData);
      localStorage.setItem('savedSeatings', JSON.stringify(this.savedSeatings));
    },
    loadSeating(index) {
      const seating = this.savedSeatings[index];
      this.request = JSON.parse(JSON.stringify(seating.request));
      this.response = [...seating.response];
      this.fitness = seating.fitness;
      this.ignored = [...seating.ignored];
      this.chosenIndex = index;
    },
    clearData() {
      this.request.students.splice(0, this.request.students.length);
      this.request.students.push({
        id: 0,
        name: '',
        preferredRows: '',
        preferredColumns: '',
        medicalPreferredRow: '',
        medicalPreferredColumn: '',
      });
      this.request.preferences.splice(0, this.request.preferences.length);
      this.request.forbidden.splice(0, this.request.forbidden.length);
      this.request.classConfig.rows = 2;
      this.request.classConfig.columns = 2;
      this.request.classConfig.deskType = 'double';
      this.request.priority = [3, 2, 1, 0];
      this.request.popSize = 300;
      this.request.generations = 400;
      this.request.crossOverChance = 0.3;
      this.response = [];
    },
    deleteSeating(index) {
      this.savedSeatings.splice(index, 1);
      this.chosenIndex = -1;
      localStorage.setItem('savedSeatings', JSON.stringify(this.savedSeatings));
    },
    saveSeating() {
      const seatingData = {
        timestamp: new Date().toISOString(),
        request: JSON.parse(JSON.stringify(this.request)),
        response: [...this.response],
        fitness: this.fitness,
        ignored: [...this.ignored],
      };
      this.savedSeatings[this.chosenIndex] = seatingData;
      localStorage.setItem('savedSeatings', JSON.stringify(this.savedSeatings));
    },
    closeAll() {
      if (this.$refs.collapseElements) {
        const elements = Array.isArray(this.$refs.collapseElements)
          ? this.$refs.collapseElements
          : [this.$refs.collapseElements];
        elements.forEach((element) => {
          if (element) {
            const collapseInstance = new Collapse(element, { toggle: false });
            collapseInstance.hide();
          }
        });
        this.chosenStudentID = null;
      }
    },
    openEditModal(student) {
      this.editingStudent = student;
      this.modalStudent = { ...student };
      this.showModal = true;
    },
    saveStudent() {
      if (this.editingStudent) {
        Object.assign(this.editingStudent, this.modalStudent);
      } else {
        const newId = this.request.students.length;
        this.request.students.push({ id: newId, ...this.modalStudent });
      }
      this.showModal = false;
      this.modalStudent = { name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' };
    },
    validateName(name) {
      return name.trim().length > 0;
    }
  },
  watch: {
    request: {
      handler() {
        this.saveSeating();
      },
      deep: true,
    },
    response: {
      handler() {
        this.saveSeating();
      },
      deep: true,
    },
    studentSearch() {
      this.currentPageStudents = 1;
    },
  }
};
</script>

<style scoped>
.classroom {
  max-height: 80vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.header-row {
  font-weight: bold;
}

.seat-label,
.seat,
.double-desk {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  text-align: center;
  font-size: 0.7rem;
  padding: 0.5rem;
  min-width: 3rem;
  min-height: 3rem;
  max-width: 6rem;
  max-height: 6rem;
}

.double-desk {
  background-color: #f0f0f0;
}

.ignored {
  background-color: #e0e0e0;
  color: #666;
}

.seat.ignored {
  background-color: #e0e0e0;
  color: #666;
}

.double-desk {
  margin-right: 50px;
}

.single-desk {
  margin-right: 20px;
}

body {
  margin: 10px;
}
</style>