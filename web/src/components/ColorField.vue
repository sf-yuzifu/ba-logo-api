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
    <div class="color-picker-wrapper">
      <input
        type="color"
        :value="modelValue"
        class="native-color-picker"
        @input="handleColorInput"
      >
      <span class="color-hex-tag">{{ (modelValue || '#000000').toUpperCase() }}</span>
    </div>
    <div v-if="presets && presets.length" class="color-presets">
      <button
        v-for="preset in presets"
        :key="preset.color"
        type="button"
        class="color-dot"
        :class="{ active: modelValue.toLowerCase() === preset.color.toLowerCase() }"
        :style="{
          background: preset.color,
          borderColor: preset.borderColor || 'rgba(255,255,255,0.85)'
        }"
        :title="preset.name"
        @click="handlePresetClick(preset.color)"
      ></button>
    </div>
  </div>
</template>
