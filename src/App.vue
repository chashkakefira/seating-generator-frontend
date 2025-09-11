<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
      <h3 class="navbar-brand" href="#">Генератор классных рассадок</h3>
    </div>
  </nav>
  <div class="app">
    <div class="main-content">
      <div class="left-panel">
          <h3>Посадить вместе</h3>
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
            <button type="button" class="btn btn-danger" @click="request.preferences.splice(index, 1)">Удалить</button>
          </div>
          <button type="button" class="btn btn-primary mb-3" @click="request.preferences.push([0, 1])">Добавить предпочтение</button>

          <h3>Рассадить</h3>
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
          <button type="button" class="btn btn-primary mb-3" @click="request.forbidden.push([0, 1])">Добавить запрет</button>

          <h3>Конфигурация класса</h3>
          <div class="mb-3">
            <label>Ряды:</label>
            <input v-model.number="request.classConfig.columns" type="number" class="form-control" required>
          </div>
          <div class="mb-3">
            <label>Парт в ряду:</label>
            <input v-model.number="request.classConfig.rows" type="number" class="form-control" required>
          </div>
          <div class="mb-3">
            <label>Тип парт:</label>
            <select v-model="request.classConfig.deskType" class="form-control">
              <option value="single">Одиночные</option>
              <option value="double">Двойные</option>
            </select>
          </div>
          <h2>Настройки генетического алгоритма</h2>
          <p>Приоритеты параметров оценивания (от наивысшего к наименьшему):</p>
          <div class="input-group mb-4">
            <select v-model="request.priority[3]" class="form-control">
              <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                {{ pr }}
              </option>
            </select>
            <select v-model="request.priority[2]" class="form-control">
              <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                {{ pr }}
              </option>
            </select>
            <select v-model="request.priority[1]" class="form-control">
              <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                {{ pr }}
              </option>
            </select>
            <select v-model="request.priority[0]" class="form-control">
              <option v-for="pr in priorities" :value="priorities.indexOf(pr)">
                {{ pr }}
              </option>
            </select>
          </div>
            <div class="mb-3">
              <label>Размер популяции</label>
              <input v-model.number="request.popSize" type="number" class="form-control" required></input>
            </div>
            <div class="mb-3">
              <label>Количество поколений</label>
              <input v-model.number="request.generations" type="number" class="form-control" required></input>
            </div>
            <div class="mb-3">
              <label>Шанс кроссинговера</label>
              <input v-model.number="request.crossOverChance" type="float" class="form-control" required></input>
            </div>
          </div>
      <div v-if="error" class="alert alert-danger mt-3">
        {{ error }}
        <div v-if="validateErrors.length > 0" class="alert alert-danger mt-3">
          <p v-for="error in validateErrors">{{ error }}</p>
        </div>
      </div>
        <div v-if="response.length > 0" class="mt-4">
          <h3>Результат рассадки</h3>
          <p>Баллов набрано: {{ fitness }}</p>
        </div>
        <div class="central-panel">
        <h4>Визуализация</h4>
        <div v-if="request.classConfig.deskType === 'double'" class="classroom">
            <div class="row header-row">
              <div class="seat-label" ></div>
              <div v-for="col in request.classConfig.columns * 2" :key="'header-' + col" class="seat-label" :class = "{ 'desig': col % 2 === 0 }">
                {{ col }}
              </div>
            </div>
              <div v-for="row in request.classConfig.rows" :key="row" class="row">
                <div class="seat-label">{{ row }}</div>
                <div v-for="col in request.classConfig.columns * 2" :key="col" class="seat" :class="{ 'double-desk': request.classConfig.deskType === 'double' && col % 2 === 0, 'ignored': ignored.includes(getStudentID(row - 1, col - 1)) }">
                  {{ getStudentName(row - 1, col - 1) || '-' }}
                </div>
              </div>
          </div>
            <div v-else class="classroom">
              <div class="row header-row">
              <div class="seat-label" ></div>
              <div v-for="col in request.classConfig.columns" :key="'header-' + col" class="seat-label">
                {{ col }}
              </div>
            </div>
              <div v-for="row in request.classConfig.rows" :key="row" class="row">
                <div class="seat-label">{{ row }}</div>
                <div v-for="col in request.classConfig.columns" :key="col" class="seat" :class="{'ignored': ignored.includes(getStudentID(row - 1, col - 1)) }">
                  {{ getStudentName(row - 1, col - 1) || '-' }}
                </div>
              </div>
          </div>
        </div>
        <div class="right-panel">
          <h3>Ученики</h3>
          <div class="accordion" id="studentsAccordion">
            <div v-for="(student, index) in request.students" :key="index" class="accordion-item">
              <h2 class="accordion-header" :id="'heading-' + index">
                <button class="accordion-button collapsed" id="'btn' + index" type="button"  :data-bs-toggle="'collapse'" :data-bs-target="'#collapse-' + index" aria-expanded="true" :aria-controls="'collapse-' + index">
                  {{ student.name || `Ученик ${student.id}` }}
                </button>
              </h2>
              <div :id="'collapse-' + index" class="accordion-collapse collapse" ref="collapseElements" :data-bs-parent="'#studentsAccordion'">
                <div class="accordion-body">
                  <div class="input-group mb-3">
                    <input v-model="student.name" type="text" class="form-control" placeholder="Имя ученика" required></input>
                    <button type="button" class="btn btn-danger" @click="removeStudent(index)">Удалить</button>
                  </div>
                </div>
              </div>
            </div>
            <p>Выбрано {{ chosenStudentID }}</p>
          </div>
        </div>
      </div>
      <button type="submit" class="btn btn-success" @click="generateSeating">Сгенерировать рассадку</button>
      <button type="button" class="btn btn-warning" @click="clearData">Очистить данные</button>
      <button type="button" class="btn btn-success" @click="newSeating">Сохранить рассадку</button>
    </div>
</template>

<script>
import { Collapse } from 'bootstrap'; 
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
    };
  },
  mounted() {
    this.$refs.collapseElements.forEach((element, index) => {
      if (element) {
        element.addEventListener('shown.bs.collapse', () => {
          this.chosenStudentID = index;
        });
        element.addEventListener('hidden.bs.collapse', () => {
          if (this.chosenStudentID === index) {
            this.chosenStudentID = null;
          }
        });
      }
    });
  },
  beforeUnmount() {
    this.$refs.collapseElements.forEach((element, index) => {
      if (element) {
        element.removeEventListener('shown.bs.collapse', () => {
          this.chosenIndex = index;
        });
        element.removeEventListener('hidden.bs.collapse', () => {
          if (this.chosenIndex === index) {
            this.chosenIndex = null;
          }
        });
      }
    });
  },
  created(){
    const saved = localStorage.getItem('savedSeatings');
    if (saved) {
      this.savedSeatings = JSON.parse(saved);
    } else {

    }
  },
  methods: {
    validateInput() {
      const error = [];
      const { students, preferences, forbidden, classConfig } = this.request;

      // Check classConfig
      if (classConfig.rows <= 0) {
        error.push('Количество парт в ряду должно быть положительным целым числом');
      }
      if (classConfig.columns <= 0) {
        error.push('Количество рядов должно быть целым положительным числом');
      }
      const studentsIDs = new Map();
      students.forEach((student, index) => {
        studentsIDs.set(student.id, student.name);
        // Check preferredColumns, preferredRows and medicalColumns, medicalRows
        this.parseCommaSeparated(student.preferredRows).forEach((row) => {
          if (row < 0 || row >= classConfig.rows) {
            error.push(`Недопустимый ряд ${row} для ученика ${student.name}`);
          }
        })
        this.parseCommaSeparated(student.preferredColumns).forEach((col) => {
          if (col < 0 || col >= classConfig.columns * 2) {
            error.push(`Недопустимая парта ${col} для ученика ${student.name}`);
          }
        })
        this.parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
          if (col < 0 || col >= classConfig.columns * 2) {
            error.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`);
          }
        })
        this.parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
          if (row < 0 || row >= classConfig.rows) {
            error.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`);
          }
        })
      })
      // Check preferences and medical for duplicates
      preferences.forEach((pair) => {
        if (pair[0] == pair[1]) {
          error.push(`${studentsIDs.get(pair[0])} не может хотеть сидеть сам с собой`)
        }
      })
      forbidden.forEach((pair) => {
        if (pair[0] == pair[1]) {
          error.push(`${studentsIDs.get(pair[0])} не может не сидеть сам с собой`)
        }
      })
      // Check for conflicts between preferences and forbidden pairs
      const preferencePairs = new Set(preferences.map(pair => `${pair[0]}, ${pair[1]}`));
      forbidden.forEach((pair) => {
        const key = `${pair[0]}, ${pair[1]}`;
        if (preferencePairs.has(key)) {
          error.push(`Конфликт между предпочтительными и запрещенными парами: пара ${studentsIDs.get(pair[0])}, ${studentsIDs.get(pair[1])}`);
        }
      })
      // Check popSize, generations, crossOverChance
      if (this.request.popSize < 2 || this.request.popSize > 600) {
        error.push(`Размер популяции должно быть целым положительным числом не меньше 2 и не больше 600`);
      }
      if (this.request.generations < 2 || this.request.generations > 600) {
        error.push(`Количество поколений должно быть целым положительным числом не меньше 2 и не больше 600`);
      }
      if (this.request.crossOverChance < 0 || this.request.crossOverChance > 1) {
        error.push(`Шанс кроссинговера должен лежать в диапазоне (0, 1]`)
      }
      // Check priorities
      if (!this.areAllElementsUnique(this.request.priority)) {
        error.push(`Повторяющиеся элементы в приоритетах параметров оценивания`)
      }
      return error;
    },
    addStudent() {
      const newId = this.request.students.length;
      this.request.students.push({
        id: newId,
        name: '',
        preferredRows: '',
        preferredColumns: '',
        medicalPreferredRow: '',
        medicalPreferredColumn: '',
      });
    },
    removeStudent(index) {
      this.request.students.splice(index, 1);
      this.request.students.forEach((student, i) => {
        student.id = i;
      });
    },
    parseCommaSeparated(str) {
      if (!str) return [];
      return str.split(',').map(Number).filter(n => !isNaN(n)).map(n => n - 1);
    },
    async generateSeating() {
      this.closeAll();
      this.error = '';
      const validationErrors = this.validateInput();
      if (validationErrors.length) {
        this.error = 'Найдены ошибки во входных данных:';
        this.validateErrors = validationErrors;
        return ;
      }
      this.response = [];

      const requestData = {
        students: this.request.students.map(student => ({
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
          columns: (this.request.classConfig.deskType === "double") ? this.request.classConfig.columns * 2 : this.request.classConfig.columns,
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
      const seat = this.response.find(s => s.Row === row && s.Column === col);
      return seat ? seat.Student : '-';
    },
    getStudentID(row, col) {
      const seat = this.response.find(s => s.Row === row && s.Column === col);
      return seat ? seat.StudentID : '-';
    },
    areAllElementsUnique (arr) {
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
            const collapseInstance = new Collapse(element, {
              toggle: false,
            });
            collapseInstance.hide();
          }
        });
        this.chosenStudentID = null;
      }
    },
  },
  watch : {
    'request' : {
      handler() {
        this.saveSeating();
      }
    },
    'response' : {
      handler () {
        this.saveSeating();
      }
    },
    deep: true,
  },
};
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100hv;
}
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.left-panel, .right-panel {
  width: 25%;
  padding: 1rem;
  border-right: 1px solid #dee2e6;
    overflow-y: auto;
}
.center-panel {
  flex: 1;
  overflow: auto;
}
.classroom {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
}
.seat {
  width: 100px;
  height: 50px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px;
}
.double-desk {
  margin-right: 50px;
}
.single-desk {
  margin-right: 20px;
}
.ignored {
  color: red;
}
.seat-label {
  width: 100px;
  height: 50px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px;
  background-color: #f0f0f0;
  font-weight: bold;
}
.header-row {
  margin-bottom: 10px;
}
.desig {
  margin-right: 50px;
}
</style>