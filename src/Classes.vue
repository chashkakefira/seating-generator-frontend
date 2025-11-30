<template>
  <BApp> </BApp>
</template>
<script>
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
