export function useClasses()
{
    const classes = ref([]);
    const selectedClassId = ref('');
    const newClassName = ref('');
    const currentClass = ref(null);

    const saveClasses = () => {
        localStorage.setItem('Classes', classes);
    };
    const loadClass = () => {
        const saved = localStorage.getItem('Classes');
        classes.value = saved ? JSON.parse(saved) : [];
    };
}