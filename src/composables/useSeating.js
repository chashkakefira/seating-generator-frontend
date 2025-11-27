import { ref, computed, watch } from 'vue'
import axios from 'axios'

export function useSeating() {
  const request = ref({
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
  })

  const preferencesDisplay = ref([])
  const forbiddenDisplay = ref([])
  const response = ref([])
  const error = ref('')
  const validateErrors = ref([])
  const ignored = ref([])
  const priorities = ref(['Медицинские парты и ряды', 'Предпочитаемые парты и ряды', 'Запрещенные пары', 'Предпочтения учеников по парам'])
  const savedSeatings = ref([])
  const chosenIndex = ref(0)
  const chosenStudentID = ref(null)
  const studentSearch = ref('')
  const currentPage = ref(1)
  const perPage = ref(8)
  const showModal = ref(false)
  const editingStudent = ref(null)
  const modalStudent = ref({ name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' })
  const fitness = ref(0)

  const studentFields = ref([
    { key: 'name', label: 'Имя' },
    { key: 'preferredRows', label: 'Предпочт. ряды' },
    { key: 'preferredColumns', label: 'Предпочт. парты' },
    { key: 'medicalPreferredRow', label: 'Мед. ряды' },
    { key: 'medicalPreferredColumn', label: 'Мед. парты' },
    { key: 'actions', label: 'Действия' }
  ])

  const accordionItems = { 
    3 : 'Медицинские парты и ряды' ,
    2 : 'Предпочитаемые парты и ряды',
    1 : 'Запрещенные пары' ,
    0 : 'Предпочтения учеников по парам', 
  };


  const onDragEnd = () => {
    request.priority = accordionItems.value.map(item => item.priorityValue)
  }

  const filteredStudents = computed(() => {
    return request.value.students.filter(student =>
      student.name.toLowerCase().includes(studentSearch.value.toLowerCase())
    )
  })

  const paginatedStudents = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    const end = start + perPage.value
    return filteredStudents.value.slice(start, end)
  })

  function initDisplayArrays() {
    preferencesDisplay.value = request.value.preferences.map(pair =>
      pair.map(id => getStudentNameById(id))
    )
    forbiddenDisplay.value = request.value.forbidden.map(pair =>
      pair.map(id => getStudentNameById(id))
    )
  }

  function getStudentNameById(id) {
    const student = request.value.students.find(s => s.id === id)
    return student ? (student.name || `Ученик ${id}`) : ''
  }

  function getStudentIdByName(name) {
    if (!name) return null
    const student = request.value.students.find(s =>
      (s.name || `Ученик ${s.id}`) === name.trim()
    )
    return student ? student.id : null
  }

  function updateIdFromName(type, pairIndex, studentIndex, name) {
    const id = getStudentIdByName(name)
    if (id !== null) {
      const array = type === 'preferences' ? request.value.preferences : request.value.forbidden
      array[pairIndex][studentIndex] = id
      const displayArray = type === 'preferences' ? preferencesDisplay.value : forbiddenDisplay.value
      displayArray[pairIndex][studentIndex] = name
    } else if (name === '') {
      const array = type === 'preferences' ? request.value.preferences : request.value.forbidden
      array[pairIndex][studentIndex] = null
      const displayArray = type === 'preferences' ? preferencesDisplay.value : forbiddenDisplay.value
      displayArray[pairIndex][studentIndex] = ''
    }
  }

  function addPreference() {
    request.value.preferences.push([null, null])
    preferencesDisplay.value.push(['', ''])
  }

  function removePreference(index) {
    request.value.preferences.splice(index, 1)
    preferencesDisplay.value.splice(index, 1)
  }

  function addForbidden() {
    request.value.forbidden.push([null, null])
    forbiddenDisplay.value.push(['', ''])
  }

  function removeForbidden(index) {
    request.value.forbidden.splice(index, 1)
    forbiddenDisplay.value.splice(index, 1)
  }

  function validateInput() {
    const error = []
    const { students, preferences, forbidden, classConfig } = request.value

    if (classConfig.rows <= 0) {
      error.push('Количество парт в ряду должно быть положительным целым числом')
    }
    if (classConfig.columns <= 0) {
      error.push('Количество рядов должно быть целым положительным числом')
    }

    const studentsIDs = new Map()
    students.forEach((student, index) => {
      studentsIDs.set(student.id, student.name)
      parseCommaSeparated(student.preferredRows).forEach((row) => {
        if (row < 0 || row >= classConfig.rows) {
          error.push(`Недопустимый ряд ${row} для ученика ${student.name}`)
        }
      })
      parseCommaSeparated(student.preferredColumns).forEach((col) => {
        if (col < 0 || col >= (classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns)) {
          error.push(`Недопустимая парта ${col} для ученика ${student.name}`)
        }
      })
      parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
        if (col < 0 || col >= (classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns)) {
          error.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`)
        }
      })
      parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
        if (row < 0 || row >= classConfig.rows) {
          error.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`)
        }
      })
    })

    preferences.forEach((pair) => {
      if (pair[0] === pair[1] && pair[0] !== null) {
        error.push(`${studentsIDs.get(pair[0])} не может хотеть сидеть сам с собой`)
      }
    })

    forbidden.forEach((pair) => {
      if (pair[0] === pair[1] && pair[0] !== null) {
        error.push(`${studentsIDs.get(pair[0])} не может не сидеть сам с собой`)
      }
    })

    const preferencePairs = new Set(preferences.map((pair) => `${pair[0]},${pair[1]}`))
    forbidden.forEach((pair) => {
      const key = `${pair[0]},${pair[1]}`
      if (preferencePairs.has(key)) {
        error.push(`Конфликт между предпочтительными и запрещенными парами: пара ${studentsIDs.get(pair[0])},${studentsIDs.get(pair[1])}`)
      }
    })

    if (request.value.popSize < 2 || request.value.popSize > 600) {
      error.push('Размер популяции должен быть целым положительным числом не меньше 2 и не больше 600')
    }
    if (request.value.generations < 2 || request.value.generations > 600) {
      error.push('Количество поколений должно быть целым положительным числом не меньше 2 и не больше 600')
    }
    if (request.value.crossOverChance < 0 || request.value.crossOverChance > 1) {
      error.push('Шанс кроссинговера должен лежать в диапазоне (0, 1]')
    }
    if (!areAllElementsUnique(request.value.priority)) {
      error.push('Повторяющиеся элементы в приоритетах параметров оценивания')
    }

    return error
  }

  function addStudent() {
    editingStudent.value = null
    modalStudent.value = { name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' }
    showModal.value = true
  }

  function removeStudent(index) {
    request.value.students.splice(index, 1)
    request.value.students.forEach((student, i) => {
      student.id = i
    })
    initDisplayArrays()
  }

  function parseCommaSeparated(str) {
    if (!str) return []
    return str.split(',').map(Number).filter((n) => !isNaN(n)).map((n) => n - 1)
  }

  async function generateSeating() {
    closeAll()
    error.value = ''
    const validationErrors = validateInput()
    if (validationErrors.length) {
      error.value = 'Найдены ошибки во входных данных:'
      validateErrors.value = validationErrors
      return
    }
    response.value = []

    const requestData = {
      students: request.value.students.map((student) => ({
        id: student.id,
        name: student.name,
        preferredRows: parseCommaSeparated(student.preferredRows),
        preferredColumns: parseCommaSeparated(student.preferredColumns),
        medicalPreferredRows: parseCommaSeparated(student.medicalPreferredRow),
        medicalPreferredColumns: parseCommaSeparated(student.medicalPreferredColumn),
      })),
      preferences: request.value.preferences,
      forbidden: request.value.forbidden,
      classConfig: {
        rows: request.value.classConfig.rows,
        columns: request.value.classConfig.deskType === 'double' ? request.value.classConfig.columns * 2 : request.value.classConfig.columns,
      },
      popSize: request.value.popSize,
      generations: request.value.generations,
      crossOverChance: request.value.crossOverChance,
      priority: request.value.priority,
    }

    try {
      const res = await axios.post(import.meta.env.VITE_API_URL || 'http://localhost:5000', requestData, {
        headers: { 'Content-Type': 'application/json' },
      })
      response.value = res.data.Seating || []
      fitness.value = res.data.Fitness || 0
      ignored.value = res.data.Ignored || []
    } catch (err) {
      error.value = err.response?.data || 'Ошибка при генерации рассадки'
    }
  }

  function getStudentName(row, col) {
    const seat = response.value.find((s) => s.Row === row && s.Column === col)
    return seat ? seat.Student : '-'
  }

  function getStudentID(row, col) {
    const seat = response.value.find((s) => s.Row === row && s.Column === col)
    return seat ? seat.StudentID : '-'
  }

  function areAllElementsUnique(arr) {
    return new Set(arr).size === arr.length
  }

  function newSeating() {
    const seatingData = {
      timestamp: new Date().toISOString(),
      request: JSON.parse(JSON.stringify(request.value)),
      response: [...response.value],
      fitness: fitness.value,
      ignored: [...ignored.value],
    }
    savedSeatings.value.push(seatingData)
    localStorage.setItem('savedSeatings', JSON.stringify(savedSeatings.value))
  }

  function loadSeating(index) {
    const seating = savedSeatings.value[index]
    request.value = JSON.parse(JSON.stringify(seating.request))
    response.value = [...seating.response]
    fitness.value = seating.fitness
    ignored.value = [...seating.ignored]
    chosenIndex.value = index
    initDisplayArrays()
  }

  function clearData() {
    request.value.students.splice(0, request.value.students.length)
    request.value.students.push({
      id: 0,
      name: '',
      preferredRows: '',
      preferredColumns: '',
      medicalPreferredRow: '',
      medicalPreferredColumn: '',
    })
    request.value.preferences.splice(0, request.value.preferences.length)
    request.value.forbidden.splice(0, request.value.forbidden.length)
    request.value.classConfig.rows = 2
    request.value.classConfig.columns = 2
    request.value.classConfig.deskType = 'double'
    request.value.priority = [3, 2, 1, 0]
    request.value.popSize = 300
    request.value.generations = 400
    request.value.crossOverChance = 0.3
    response.value = []
    preferencesDisplay.value = []
    forbiddenDisplay.value = []
    error.value = ''
    validateErrors.value = []
  }

  function deleteSeating(index) {
    savedSeatings.value.splice(index, 1)
    chosenIndex.value = -1
    localStorage.setItem('savedSeatings', JSON.stringify(savedSeatings.value))
  }

  function saveSeating() {
    const seatingData = {
      timestamp: new Date().toISOString(),
      request: JSON.parse(JSON.stringify(request.value)),
      response: [...response.value],
      fitness: fitness.value,
      ignored: [...ignored.value],
    }
    savedSeatings.value[chosenIndex.value] = seatingData
    localStorage.setItem('savedSeatings', JSON.stringify(savedSeatings.value))
  }

  function closeAll() {
    chosenStudentID.value = null
  }

  function openEditModal(student) {
    editingStudent.value = student
    modalStudent.value = { ...student }
    showModal.value = true
  }

  function saveStudent() {
    if (editingStudent.value) {
      Object.assign(editingStudent.value, modalStudent.value)
    } else {
      const newId = request.value.students.length
      request.value.students.push({ id: newId, ...modalStudent.value })
    }
    showModal.value = false
    modalStudent.value = { name: '', preferredRows: '', preferredColumns: '', medicalPreferredRow: '', medicalPreferredColumn: '' }
    initDisplayArrays()
  }

  function validateName(name) {
    return name.trim().length > 0
  }

  const savedData = localStorage.getItem('seatingRequest')
  if (savedData) {
    const parsedData = JSON.parse(savedData)
    request.value = {
      ...parsedData,
      students: parsedData.students || [],
      preferences: parsedData.preferences || [],
      forbidden: parsedData.forbidden || [],
      classConfig: parsedData.classConfig || request.value.classConfig,
      popSize: parsedData.popSize || 300,
      generations: parsedData.generations || 400,
      crossOverChance: parsedData.crossOverChance || 0.3,
      priority: parsedData.priority || [3, 2, 1, 0],
    }
  }
  initDisplayArrays()

  watch(
    () => request.value.students,
    () => {
      initDisplayArrays()
    },
    { deep: true }
  )

  watch(
    () => request.value.preferences,
    () => {
      initDisplayArrays()
    },
    { deep: true }
  )

  watch(
    () => request.value.forbidden,
    () => {
      initDisplayArrays()
    },
    { deep: true }
  )

  watch(
    () => studentSearch.value,
    () => {
      currentPage.value = 1
    }
  )

  return {
    request,
    preferencesDisplay,
    forbiddenDisplay,
    response,
    error,
    validateErrors,
    ignored,
    priorities,
    savedSeatings,
    chosenIndex,
    chosenStudentID,
    studentSearch,
    currentPage,
    perPage,
    showModal,
    editingStudent,
    modalStudent,
    fitness,
    studentFields,
    filteredStudents,
    paginatedStudents,
    accordionItems,
    initDisplayArrays,
    getStudentNameById,
    getStudentIdByName,
    updateIdFromName,
    addPreference,
    removePreference,
    addForbidden,
    removeForbidden,
    validateInput,
    addStudent,
    removeStudent,
    parseCommaSeparated,
    generateSeating,
    getStudentName,
    getStudentID,
    areAllElementsUnique,
    newSeating,
    loadSeating,
    clearData,
    deleteSeating,
    saveSeating,
    closeAll,
    openEditModal,
    saveStudent,
    validateName,
    onDragEnd,
  }
}
