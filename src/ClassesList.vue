<template>
  <BApp>
    <div class="p-2">
      <h1>Мои класс</h1>
      <BCardGroup v-for="cls in classes">
        <BCard :title="cls.name" style="max-width: 20rem">
          <BCardText>
            Создан: {{ cls.id }} Содержит {{ cls.students.length }} ученика(ков)
          </BCardText>
          <BButton
            :to="{ name: 'ClassEditor', params: { id: cls.id } }"
            variant="primary"
            >Изменить</BButton
          >
          <BButton @click="deleteClass(cls.id)" variant="danger"
            >Удалить</BButton
          >
        </BCard>
      </BCardGroup>
    </div>
  </BApp>
  <router-view />
</template>
<script setup>
import { BApp } from "bootstrap-vue-next";
import useClasses from "./composables/useClasses.js";
const {
  classes,
  selectedClassId,
  newClassName,
  currentClass,
  saveClasses,
  addNewClass,
  deleteClass,
  loadClass,
} = useClasses();
</script>
