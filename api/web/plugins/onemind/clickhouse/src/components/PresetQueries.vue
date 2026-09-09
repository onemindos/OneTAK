<template>
  <div class="presets">
    <div class="presets__header">Presets</div>
    <div
      v-for="preset in PRESET_QUERIES"
      :key="preset.id"
      class="presets__item"
      :class="`presets__item--${preset.category}`"
      @click="$emit('select', preset.sql)"
    >
      <span class="presets__label">{{ preset.label }}</span>
      <span class="presets__desc">{{ preset.description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PRESET_QUERIES } from '../store'
defineEmits<{ select: [sql: string] }>()
</script>

<style scoped>
.presets__header {
  padding: 8px 12px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #555;
}

.presets__item {
  padding: 7px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #1a1a2a;
}

.presets__item:hover {
  background: #1a1a2e;
}

.presets__label {
  font-size: 12px;
  color: #e0e0e0;
}

.presets__desc {
  font-size: 11px;
  color: #666;
}

.presets__item--tracks .presets__label  { color: #4a9eff; }
.presets__item--events .presets__label  { color: #f0a500; }
.presets__item--intel .presets__label   { color: #ff6b6b; }
.presets__item--custom .presets__label  { color: #7b8cde; }
</style>
