<template>
    <div
        class='wire-frame'
        :class='{ expanded: isExpanded }'
        @click='isExpanded = !isExpanded'
    >
        <!-- ── Summary row ──────────────────────────────────────────────────── -->
        <div class='wf-row'>
            <!-- Badge -->
            <span
                class='wf-badge'
                :style='{ color: BADGE_STYLE[badge].color, background: BADGE_STYLE[badge].bg }'
            >{{ badge }}</span>

            <!-- Subject -->
            <span
                class='wf-subject'
                :title='frame.subject'
            >{{ frame.subject }}</span>

            <!-- Size -->
            <span class='wf-size'>{{ formatSize(frame.size) }}</span>

            <!-- Timestamp -->
            <span class='wf-ts'>{{ formatTs(frame.ts) }}</span>

            <!-- Expand indicator -->
            <ChevronDown
                class='wf-chevron'
                :class='{ rotated: isExpanded }'
                :size='11'
            />
        </div>

        <!-- ── Expanded: payload ────────────────────────────────────────────── -->
        <div
            v-if='isExpanded'
            class='wf-payload'
        >
            <!-- Reply-to -->
            <div
                v-if='frame.replyTo'
                class='wf-meta'
            >
                <span class='wf-meta-label'>reply-to</span>
                <span class='wf-meta-val'>{{ frame.replyTo }}</span>
            </div>
            <!-- Headers -->
            <template v-if='frame.headers && Object.keys(frame.headers).length'>
                <div
                    v-for='(vals, key) in frame.headers'
                    :key='key'
                    class='wf-meta'
                >
                    <span class='wf-meta-label'>{{ key }}</span>
                    <span class='wf-meta-val'>{{ vals.join(', ') }}</span>
                </div>
            </template>
            <!-- Payload -->
            <pre class='wf-pre'>{{ prettyData }}</pre>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue';
import { ChevronDown }  from 'lucide-vue-next';
import type { TapFrame } from '../composables/useNatsTap';
import type { Badge }    from './wire.types';
import { BADGE_STYLE, inferBadge } from './wire.types';

const props = defineProps<{ frame: TapFrame }>();

const isExpanded = ref(false);
const badge      = computed<Badge>(() => inferBadge(props.frame.subject));

const prettyData = computed(() => {
    const raw = props.frame.data;
    if (!raw) return '(empty)';
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch { // ignore
        return raw;
    }
});

function formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes}b`;
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)}kb`;
    return `${(bytes/(1024*1024)).toFixed(1)}mb`;
}

function formatTs(ts: number): string {
    return new Date(ts).toISOString().slice(11, 23); // HH:MM:SS.mmm
}
</script>

<style scoped>
.wire-frame {
    border-bottom: 1px solid rgba(255,255,255,0.04);
    cursor: pointer;
    transition: background .08s;
}
.wire-frame:hover { background: rgba(255,255,255,0.03); }
.wire-frame.expanded { background: rgba(255,255,255,0.04); }

.wf-row {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 12px;
    min-height: 26px;
}

.wf-badge {
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 700;
    font-family: monospace;
    padding: 1px 5px;
    border-radius: 3px;
    min-width: 40px;
    text-align: center;
}

.wf-subject {
    flex: 1;
    font-family: monospace;
    font-size: 11px;
    color: #c9d1d9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wf-size {
    flex-shrink: 0;
    font-size: 10px;
    color: rgba(255,255,255,0.25);
    font-family: monospace;
    min-width: 36px;
    text-align: right;
}

.wf-ts {
    flex-shrink: 0;
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    font-family: monospace;
    min-width: 82px;
    text-align: right;
}

.wf-chevron {
    flex-shrink: 0;
    color: rgba(255,255,255,0.2);
    transition: transform .15s;
}
.wf-chevron.rotated { transform: rotate(180deg); }

/* Expanded payload */
.wf-payload {
    padding: 4px 12px 10px 52px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.wf-meta {
    display: flex;
    gap: 8px;
    font-size: 10px;
    font-family: monospace;
}
.wf-meta-label {
    color: rgba(255,255,255,0.3);
    min-width: 70px;
    flex-shrink: 0;
}
.wf-meta-val { color: rgba(255,255,255,0.55); }

.wf-pre {
    margin: 4px 0 0;
    padding: 8px 10px;
    background: rgba(0,0,0,0.3);
    border-radius: 5px;
    font-size: 11px;
    font-family: monospace;
    color: #a3d9a5;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 300px;
    overflow-y: auto;
}
</style>
