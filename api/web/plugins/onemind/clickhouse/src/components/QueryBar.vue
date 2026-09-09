<template>
  <div class="query-bar">
    <textarea
      :value="modelValue"
      class="query-bar__input"
      placeholder="SELECT * FROM cot_events LIMIT 100"
      rows="4"
      :disabled="loading"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keydown.ctrl.enter.prevent="$emit('run')"
      @keydown.meta.enter.prevent="$emit('run')"
    />
    <div class="query-bar__actions">
      <span class="query-bar__hint">Ctrl+Enter to run</span>
      <button
        class="query-bar__run"
        :disabled="loading || !modelValue.trim()"
        @click="$emit('run')"
      >
        {{ loading ? 'Running…' : 'Run' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; loading: boolean }>()
defineEmits<{ 'update:modelValue': [val: string]; run: [] }>()
</script>

<style scoped>
.query-bar {
  border-bottom: 1px solid #2a2a3a;
  background: #0f1117;
}

.query-bar__input {
  width: 100%;
  background: #0f1117;
  color: #e0e0e0;
  border: none;
  border-bottom: 1px solid #1a1a2a;
  padding: 10px 12px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.query-bar__input:focus {
  background: #12141e;
}

.query-bar__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
}

.query-bar__hint {
  font-size: 11px;
  color: #555;
}

.query-bar__run {
  background: #2a4a8a;
  color: #e0e0e0;
  border: none;
  border-radius: 4px;
  padding: 5px 16px;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
}

.query-bar__run:hover:not(:disabled) {
  background: #3a5aaa;
}

.query-bar__run:disabled {
  background: #1a1a2a;
  color: #555;
  cursor: not-allowed;
}
</style>
