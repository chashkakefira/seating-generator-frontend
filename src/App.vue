<template>
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
            <input type="text" :list="'pref-students1-' + index" v-model="preferencesDisplay[index][0]"
              class="form-control" placeholder="Первый ученик"
              @blur="updateIdFromName('preferences', index, 0, $event.target.value)" />
            <datalist :id="'pref-students1-' + index">
              <option v-for="student in request.students" :key="'pref1-' + student.id"
                :value="student.name || `Ученик ${student.id}`">
              </option>
            </datalist>
            <input type="text" :list="'pref-students2-' + index" v-model="preferencesDisplay[index][1]"
              class="form-control" placeholder="Второй ученик"
              @blur="updateIdFromName('preferences', index, 1, $event.target.value)" />
            <datalist :id="'pref-students2-' + index">
              <option v-for="student in request.students" :key="'pref2-' + student.id"
                :value="student.name || `Ученик ${student.id}`">
              </option>
            </datalist>
            <button type="button" class="btn btn-danger" @click="removePreference(index)">Удалить</button>
          </div>
          <button type="button" class="btn btn-primary mb-3" @click="addPreference">Добавить предпочтение</button>


          <h3>Запрещённые пары</h3>
          <div v-for="(pref, index) in request.forbidden" :key="'forbidden-' + index" class="input-group mb-2">
            <input type="text" :list="'forbidden-students1-' + index" v-model="forbiddenDisplay[index][0]"
              class="form-control" placeholder="Первый ученик"
              @blur="updateIdFromName('forbidden', index, 0, $event.target.value)" />
            <datalist :id="'forbidden-students1-' + index">
              <option v-for="student in request.students" :key="'forbidden1-' + student.id"
                :value="student.name || `Ученик ${student.id}`">
              </option>
            </datalist>
            <input type="text" :list="'forbidden-students2-' + index" v-model="forbiddenDisplay[index][1]"
              class="form-control" placeholder="Второй ученик"
              @blur="updateIdFromName('forbidden', index, 1, $event.target.value)" />
            <datalist :id="'forbidden-students2-' + index">
              <option v-for="student in request.students" :key="'forbidden2-' + student.id"
                :value="student.name || `Ученик ${student.id}`">
              </option>
            </datalist>
            <button type="button" class="btn btn-danger" @click="removeForbidden(index)">Удалить</button>
          </div>
          <button type="button" class="btn btn-primary mb-3" @click="addForbidden">Добавить запрет</button>
        </BCol>
      </BRow>
    </BContainer>
    <router-view />
  </BApp>
</template>

<script setup>
import { useSeating } from './composables/useSeating'

const {
  request,
  response,
  fitness,
  ignored,
  error,
  validateErrors,
  priorities,
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
  preferencesDisplay,
  forbiddenDisplay,
  addPreference,
  removePreference,
  addForbidden,
  removeForbidden,
  updateIdFromName,
} = useSeating()
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
