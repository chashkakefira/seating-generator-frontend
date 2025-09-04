<template>
  <div class="container mt-4">
    <h1>Генератор классной рассадки</h1>

    <form @submit.prevent="generateSeating">
      <h3>Ученики</h3>
      <div v-for="(student, index) in request.students" :key="index" class="mb-3">
        <div class="input-group">
          <input v-model="student.name" type="text" class="form-control" placeholder="Имя ученика" required>
          <input v-model="student.preferredColumns" type="text" class="form-control" placeholder="Предпочитаемые ряды (через запятую)">
          <input v-model="student.preferredRows" type="text" class="form-control" placeholder="Предпочитаемые парты (через запятую)">
          <input v-model="student.medicalPreferredColumn" type="text" class="form-control" placeholder="Медицинские ряды (через запятую)">
          <input v-model="student.medicalPreferredRow" type="text" class="form-control" placeholder="Медицинские парты (через запятую)">
          <button type="button" class="btn btn-danger" @click="removeStudent(index)">Удалить</button>
        </div>
      </div>
      <button type="button" class="btn btn-primary mb-3" @click="addStudent">Добавить студента</button>

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
        <button type="button" class="btn btn-danger" @click="request.preferences.splice(index, 1)">Удалить</button>
      </div>
      <button type="button" class="btn btn-primary mb-3" @click="request.preferences.push([0, 1])">Добавить предпочтение</button>

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

      <button type="submit" class="btn btn-success">Сгенерировать рассадку</button>
    </form>
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
    <h4>Визуализация</h4>
    <div v-if="request.classConfig.deskType === 'double'" class="classroom">
        <div class="row header-row">
          <div class="seat-label" ></div>
          <!--Not working-->
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
</template>

<script>
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
      },
      preferencesInput: [0, 1],
      forbiddenInput: [0, 1],
      response: [],
      error: '',
      validateErrors: [],
      ignored: [],
    };
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
      };

      try {
        const res = await axios.post('http://localhost:5000/generate-seating', requestData, {
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
      console.log(`${seat ? seat.StudentID : '-'}`)
      return seat ? seat.StudentID : '-';
    }
  },
};
</script>

<style scoped>
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