<template>
  <BApp>
    <div class="p-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Мои классы</h1>
        <BButton variant="success" @click="showModal = true"
          >Добавить класс</BButton
        >
      </div>

      <BRow>
        <BCol
          v-for="cls in classes"
          :key="cls.id"
          cols="12"
          md="6"
          lg="4"
          class="mb-3"
        >
          <BCard :title="cls.name" class="h-100">
            <BCardText>
              Создан: {{ new Date(Number(cls.id)).toLocaleString("ru-RU") }}
              <br />
              Учеников: {{ cls.students?.length || 0 }}
            </BCardText>

            <div class="d-flex gap-2 mt-3">
              <BButton
                :to="{ name: 'ClassEditor', params: { id: cls.id } }"
                variant="primary"
              >
                Изменить
              </BButton>
              <BButton @click="deleteClass(cls.id)" variant="danger">
                Удалить
              </BButton>
            </div>
          </BCard>
        </BCol>
      </BRow>

      <BModal
        v-model="showModal"
        title="Новый класс"
        @ok="addNewClass(newClassName)"
      >
        <BFormInput
          v-model="newClassName"
          placeholder="Название"
          autofocus
          @keyup.enter="
            addNewClass(newClassName);
            showModal = false;
          "
        />
      </BModal>
    </div>
  </BApp>
  <router-view />
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { BApp } from "bootstrap-vue-next";
import useClasses from "./composables/useClasses.js";

const {
  classes,
  newClassName,
  addNewClass,
  deleteClass,
  saveClasses,
  loadClasses,
} = useClasses();
const showModal = ref(false);

onMounted(() => {
  loadClasses();
});

watch(
  classes,
  () => {
    saveClasses();
  },
  { deep: true }
);
</script>
