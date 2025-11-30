import { ref } from 'vue';
const classes = ref([]);
const currentClass = ref(null);
export default function useClasses()
{
    const selectedClassId = ref('');
    const newClassName = ref('');
    const saveClasses = () => {
        localStorage.setItem('Classes', JSON.stringify(classes));
    };
    const loadClass = () => {
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
    return {
        classes,
        selectedClassId,
        newClassName,
        currentClass,
        saveClasses,
        addNewClass,
        deleteClass,
    };
}