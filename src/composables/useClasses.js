import { ref, computed } from 'vue';
const classes = ref([]);
const currentClass = ref(null);
export default function useClasses()
{
    const selectedClassId = ref('');
    const newClassName = ref('');
    const saveClasses = () => {
        localStorage.setItem('Classes', JSON.stringify(classes.value));
    };
    const loadClasses = () => {
        const saved = localStorage.getItem('Classes');
        classes.value = saved ? JSON.parse(saved) : [];
    };
    const addNewClass = (name) => {
        const newClass = { id: Date.now(), name, students: [], preferences: [[]], forbidden: [[]]};
        classes.value.push(newClass);
        saveClasses();
    };
    const deleteClass = (id) => {
        const idx = classes.value.findIndex(cls => cls.id === id);
        if (idx !== -1) {
            classes.value.splice(idx, 1);
            saveClasses();
        }
    };
    const addPreference = (cls) => {
        cls.preferences.push(["", ""])
    };
    const checkName = (name, cls) => {
        if (!name) return null;
        return cls.students.some(s => s.name === name);
    };
    const validateErrors = computed(() => {
        const error = []
        const { students, preferences, forbidden, classConfig } = request.value
    
        if (classConfig.rows <= 0) {
          error.push('Количество рядов должно быть положительным целым числом')
        }
        if (classConfig.columns <= 0) {
          error.push('Количество парт должно быть положительным целым числом')
        }
    
        const studentsIDs = new Map()
        students.forEach((student) => {
          studentsIDs.set(student.id, student.name)
          parseCommaSeparated(student.preferredRows).forEach((row) => {
            if (row < 0 || row >= classConfig.rows) {
              error.push(`Недопустимый ряд ${row} для ученика ${student.name}`)
            }
          })
          parseCommaSeparated(student.preferredColumns).forEach((col) => {
            const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
            if (col < 0 || col >= maxCols) {
              error.push(`Недопустимая парта ${col} для ученика ${student.name}`)
            }
          })
          parseCommaSeparated(student.medicalPreferredColumn).forEach((col) => {
            const maxCols = classConfig.deskType === 'double' ? classConfig.columns * 2 : classConfig.columns
            if (col < 0 || col >= maxCols) {
              error.push(`Недопустимая парта ${col} для ученика ${student.name} в медицинских предпочтениях`)
            }
          })
          parseCommaSeparated(student.medicalPreferredRow).forEach((row) => {
            if (row < 0 || row >= classConfig.rows) {
              error.push(`Недопустимый ряд ${row} для ученика ${student.name} в медицинских предпочтениях`)
            }
          })
        })
    
        const checkDuplicates = (pairs, listName) => {
          const seen = new Set()
          pairs.forEach(pair => {
            if (pair[0] !== null && pair[1] !== null) {
              const key = JSON.stringify([...pair].sort())
              if (seen.has(key)) {
                const n1 = studentsIDs.get(pair[0]) || '?'
                const n2 = studentsIDs.get(pair[1]) || '?'
                error.push(`Дублирующаяся пара в ${listName}: ${n1} и ${n2}`)
              }
              seen.add(key)
            }
          })
        }
        checkDuplicates(preferences, 'предпочтениях')
        checkDuplicates(forbidden, 'запретах')
    
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
    
        const prefKeys = new Set(preferences.map(p => JSON.stringify([...p].sort())))
        forbidden.forEach(pair => {
          const key = JSON.stringify([...pair].sort())
          if (prefKeys.has(key) && pair[0] !== null && pair[1] !== null) {
            const n1 = studentsIDs.get(pair[0])
            const n2 = studentsIDs.get(pair[1])
            error.push(`Противоречие: пара ${n1} и ${n2} есть и в желаемых, и в запрещенных`)
          }
        })

        return error;
    })
    return {
        classes,
        selectedClassId,
        newClassName,
        currentClass,
        validateErrors,
        saveClasses,
        addNewClass,
        deleteClass,
        loadClasses,
        addPreference,
        checkName,
    };
}