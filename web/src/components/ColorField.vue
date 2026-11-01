<script setup lang="ts">
import type { ColorPreset } from '../types.ts';

const props = defineProps<{
  modelValue: string;
  presets?: ColorPreset[];
}>();

const emit = defineEmits<(e: 'update:modelValue', value: string) => void>();

const handlePresetClick = (color: string) => {
  emit('update:modelValue', color);
};

const handleColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="color-picker-row">
    <input
      type="color"
      :value="modelValue"
      @input="handleColorInput"
    >
    <div v-if="presets && presets.length" class="color-presets">
      <div
        v-for="preset in presets"
        :key="preset.color"
        class="color-dot"
        :style="{
          background: preset.color,
          borderColor: preset.borderColor || '#fff'
        }"
        :title="preset.name"
        @click="handlePresetClick(preset.color)"
      ></div>
    </div>
  </div>
</template>
