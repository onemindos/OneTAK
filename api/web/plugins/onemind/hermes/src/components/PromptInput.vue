<template>
  <div class="prompt-input">
    <textarea
      ref="inputEl"
      v-model="text"
      class="prompt-input__textarea"
      placeholder="Ask Hermes…"
      rows="2"
      :disabled="disabled"
      @keydown.enter.exact.prevent="submit"
    />
    <button
      class="prompt-input__send"
      :disabled="disabled || !text.trim()"
      @click="submit"
    >
      ›
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [content: string] }>()

const text = ref('')
const inputEl = ref<HTMLTextAreaElement | null>(null)

function submit() {
  const content = text.value.trim()
  if (!content) return
  emit('send', content)
  text.value = ''
  inputEl.value?.focus()
}
</script>

<style scoped>
.prompt-input {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px;
  background: #0f0f1e;
}

.prompt-input__textarea {
  flex: 1;
  resize: none;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  padding: 6px 8px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
  outline: none;
}

.prompt-input__textarea:focus {
  border-color: #7b8cde;
}

.prompt-input__textarea:disabled {
  opacity: 0.5;
}

.prompt-input__send {
  background: #7b8cde;
  color: #0f0f1e;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.prompt-input__send:disabled {
  background: #2a2a4a;
  color: #555;
  cursor: not-allowed;
}
</style>
