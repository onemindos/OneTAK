<template>
    <div class="nats-settings">
        <!-- Sidebar -->
        <div class="ns-sidebar">
            <div class="ns-sidebar-hd">
                SETTINGS
            </div>
            <button
                v-for="sec in SETTINGS_SECTIONS"
                :key="sec.id"
                class="ns-sidebar-btn"
                :class="{ active: activeSection === sec.id }"
                @click="activeSection = sec.id"
            >
                <component
                    :is="sec.icon"
                    :size="12"
                />
                {{ sec.label }}
            </button>
        </div>

        <!-- Content -->
        <div class="ns-content">
            <!-- ── CONNECTION ──────────────────────────────────────────────── -->
            <template v-if='activeSection === "connection"'>
                <div class="ns-section-hd">
                    <Settings
                        :size="13"
                        class="ns-icon"
                    />
                    <span>Connection Profiles</span>
                </div>
                <div class="ns-profiles">
                    <div
                        v-for="p in profiles"
                        :key="p.id"
                        class="ns-profile"
                        :class='{ active: p.id === activeProfileId, connected: status === "connected" && p.id === activeProfileId }'
                    >
                        <div class="nsp-row">
                            <div class="nsp-info">
                                <span class="nsp-label">{{ p.label }}</span>
                                <span class="nsp-url">{{ p.wsUrl }}</span>
                            </div>
                            <div class="nsp-actions">
                                <button
                                    v-if='p.id !== activeProfileId || status !== "connected"'
                                    class="nsp-btn nsp-btn-connect"
                                    :disabled='status === "connecting"'
                                    @click="connectTo(p.id)"
                                >
                                    Connect
                                </button>
                                <button
                                    v-else
                                    class="nsp-btn nsp-btn-disconnect"
                                    @click="disconnect()"
                                >
                                    Disconnect
                                </button>
                                <button
                                    class="nsp-btn nsp-btn-edit"
                                    @click="startEdit(p)"
                                >
                                    <Pencil :size="11" />
                                </button>
                                <button
                                    class="nsp-btn nsp-btn-del"
                                    :disabled="profiles.length <= 1"
                                    @click="removeProfile(p.id)"
                                >
                                    <Trash2 :size="11" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ns-form">
                    <div class="ns-form-title">
                        {{ editingId ? 'Edit Profile' : 'Add Profile' }}
                    </div>
                    <div class="ns-fields">
                        <input
                            v-model="form.label"
                            class="ns-input"
                            placeholder="Label (e.g. OneMind Hub)"
                        >
                        <input
                            v-model="form.wsUrl"
                            class="ns-input"
                            placeholder="WebSocket URL (e.g. wss://nats-ws.onemindos.dev)"
                        >
                        <input
                            v-model="form.user"
                            class="ns-input"
                            placeholder="User (optional)"
                        >
                        <input
                            v-model="form.pass"
                            class="ns-input"
                            type="password"
                            placeholder="Password (optional)"
                        >
                    </div>
                    <div class="ns-form-actions">
                        <button
                            class="ns-btn ns-btn-save"
                            :disabled="!form.label || !form.wsUrl"
                            @click="saveForm"
                        >
                            {{ editingId ? 'Update' : 'Add' }}
                        </button>
                        <button
                            v-if="editingId"
                            class="ns-btn"
                            @click="cancelEdit"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                <div
                    v-if='status === "error" && error'
                    class="ns-error"
                >
                    <AlertCircle :size="13" /> {{ error }}
                </div>
                <div
                    v-if='status === "connected" && rtt'
                    class="ns-rtt"
                >
                    RTT: {{ rtt }}ms
                </div>
            </template>

            <!-- ── APPEARANCE ──────────────────────────────────────────────── -->
            <template v-if='activeSection === "appearance"'>
                <div class="ns-section-hd">
                    <Palette
                        :size="13"
                        class="ns-icon"
                    />
                    <span>Appearance</span>
                </div>
                <div class="ns-setting-group">
                    <div class="ns-group-label">
                        UI DENSITY
                    </div>
                    <div class="ns-options">
                        <button
                            v-for='opt in ["compact","normal","comfortable"]'
                            :key="opt"
                            class="ns-option"
                            :class="{ active: appearance.density === opt }"
                            @click='setAppearance("density", opt)'
                        >
                            {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
                        </button>
                    </div>
                </div>
                <div class="ns-setting-group">
                    <div class="ns-group-label">
                        FONT SIZE
                    </div>
                    <div class="ns-options">
                        <button
                            v-for='opt in ["small","medium","large"]'
                            :key="opt"
                            class="ns-option"
                            :class="{ active: appearance.fontSize === opt }"
                            @click='setAppearance("fontSize", opt)'
                        >
                            {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
                        </button>
                    </div>
                </div>
                <div class="ns-setting-group">
                    <div class="ns-group-label">
                        ACCENT COLOR
                    </div>
                    <div class="ns-swatches">
                        <button
                            v-for="sw in SWATCHES"
                            :key="sw.value"
                            class="ns-swatch"
                            :class="{ active: appearance.accent === sw.value }"
                            :style='{ background: sw.value, boxShadow: appearance.accent === sw.value ? `0 0 0 2px ${sw.value}` : "none" }'
                            :title="sw.name"
                            @click='setAppearance("accent", sw.value)'
                        />
                    </div>
                </div>
                <div class="ns-setting-row">
                    <div>
                        <div class="ns-row-label">
                            Nav Labels
                        </div>
                        <div class="ns-row-desc">
                            Show text labels next to nav icons
                        </div>
                    </div>
                    <button
                        class="ns-toggle"
                        :class="{ on: appearance.navLabels }"
                        @click='setAppearance("navLabels", !appearance.navLabels)'
                    >
                        <div class="ns-toggle-knob" />
                    </button>
                </div>
            </template>

            <!-- ── NOTIFICATIONS ───────────────────────────────────────────── -->
            <template v-if='activeSection === "notifications"'>
                <div class="ns-section-hd">
                    <Bell
                        :size="13"
                        class="ns-icon"
                    />
                    <span>Notifications</span>
                </div>
                <div
                    v-if='notifPermission !== "granted"'
                    class="ns-notif-perm"
                >
                    <AlertCircle
                        :size="12"
                        style="color:#f59e0b"
                    />
                    <span>Browser notifications not enabled.</span>
                    <button
                        class="ns-btn ns-btn-save"
                        style="padding:3px 10px;font-size:10px"
                        @click="requestNotifPermission"
                    >
                        Enable
                    </button>
                </div>
                <div
                    v-for="item in NOTIF_ITEMS"
                    :key="item.key"
                    class="ns-setting-row"
                >
                    <div>
                        <div class="ns-row-label">
                            {{ item.label }}
                        </div>
                        <div class="ns-row-desc">
                            {{ item.desc }}
                        </div>
                    </div>
                    <button
                        class="ns-toggle"
                        :class="{ on: notifs[item.key] }"
                        :disabled="item.locked"
                        @click="!item.locked && setNotif(item.key, !notifs[item.key])"
                    >
                        <div class="ns-toggle-knob" />
                    </button>
                </div>
                <button
                    class="ns-test-btn"
                    @click="testNotification"
                >
                    <BellRing :size="11" /> Test Notification
                </button>
            </template>

            <!-- ── PROFILE ─────────────────────────────────────────────────── -->
            <template v-if='activeSection === "profile"'>
                <div class="ns-section-hd">
                    <User
                        :size="13"
                        class="ns-icon"
                    />
                    <span>Operator Profile</span>
                </div>
                <div class="ns-avatar-row">
                    <div class="ns-avatar">
                        {{ profileInitial }}
                    </div>
                    <div>
                        <div class="ns-profile-name">
                            {{ profile.name || 'Operator' }}
                        </div>
                        <div class="ns-profile-callsign ns-mono">
                            {{ profile.callsign || 'No callsign set' }}
                        </div>
                    </div>
                </div>
                <div
                    class="ns-fields"
                    style="margin-top:12px"
                >
                    <label class="ns-field-label">Display Name</label>
                    <input
                        v-model="profile.name"
                        class="ns-input"
                        placeholder="Full name"
                    >
                    <label class="ns-field-label">Callsign</label>
                    <input
                        v-model="profile.callsign"
                        class="ns-input"
                        placeholder="e.g. ZEUS-1"
                    >
                    <label class="ns-field-label">Unit / Org</label>
                    <input
                        v-model="profile.org"
                        class="ns-input"
                        placeholder="e.g. OneMind OS"
                    >
                </div>
                <button
                    class="ns-btn ns-btn-save"
                    style="margin-top:10px;padding:6px 16px"
                    @click="saveProfile"
                >
                    <Save :size="11" /> Save Profile
                </button>
                <div
                    v-if="profileSaved"
                    class="ns-rtt"
                    style="color:#22c55e"
                >
                    Profile saved.
                </div>
            </template>

            <!-- ── ABOUT ───────────────────────────────────────────────────── -->
            <template v-if='activeSection === "about"'>
                <div class="ns-section-hd">
                    <Info
                        :size="13"
                        class="ns-icon"
                    />
                    <span>About</span>
                </div>
                <div class="ns-about-hero">
                    <div class="ns-om-badge">
                        OM
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:13px">
                            OneMind OS
                        </div>
                        <div
                            class="ns-muted"
                            style="font-size:10px"
                        >
                            Sovereign Operations Platform
                        </div>
                    </div>
                </div>
                <div class="ns-about-rows">
                    <div
                        v-for="row in ABOUT_ROWS"
                        :key="row.label"
                        class="ns-about-row"
                    >
                        <span class="ns-muted">{{ row.label }}</span>
                        <span class="ns-mono">{{ row.value }}</span>
                    </div>
                </div>
                <div class="ns-about-links">
                    <a
                        href="https://github.com/onemindos/cloudtak-plugin-nats"
                        target="_blank"
                        rel="noopener"
                        class="ns-link"
                    >
                        <ExternalLink :size="10" /> GitHub
                    </a>
                    <a
                        href="https://cloudtak.onemindos.dev"
                        target="_blank"
                        rel="noopener"
                        class="ns-link"
                    >
                        <ExternalLink :size="10" /> CloudTAK
                    </a>
                    <a
                        href="https://wwv.onemindos.dev"
                        target="_blank"
                        rel="noopener"
                        class="ns-link"
                    >
                        <ExternalLink :size="10" /> WWV
                    </a>
                </div>
                <div class="ns-about-quote">
                    OneMind OS — Zeus Delacruz<br><em>"You + AI = One Mind"</em>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, reactive, computed } from 'vue';
import {
    Settings, Pencil, Trash2, AlertCircle, Palette, Bell, BellRing,
    User, Info, Save, ExternalLink,
} from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import type { NatsProfile } from '../stores/nats.store';

const SETTINGS_SECTIONS = [
    { id: 'connection',    label: 'Connection',    icon: Settings },
    { id: 'appearance',    label: 'Appearance',    icon: Palette  },
    { id: 'notifications', label: 'Notifications', icon: Bell     },
    { id: 'profile',       label: 'Profile',       icon: User     },
    { id: 'about',         label: 'About',         icon: Info     },
] as const;

const SWATCHES = [
    { name: 'Blue',   value: '#4a9eff' },
    { name: 'Green',  value: '#22c55e' },
    { name: 'Amber',  value: '#f59e0b' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Red',    value: '#f85149' },
];

const NOTIF_ITEMS = [
    { key: 'desktop',     label: 'Desktop Notifications', desc: 'Browser push notifications for alerts',     locked: false },
    { key: 'sounds',      label: 'Sound Alerts',          desc: 'Audio cue for high-priority events',        locked: false },
    { key: 'critThreat',  label: 'Critical Threats',      desc: 'Always notify — cannot be disabled',        locked: true  },
    { key: 'highThreat',  label: 'HIGH Threats',          desc: 'Notify by default',                         locked: true  },
    { key: 'natsDisconn', label: 'NATS Disconnection',    desc: 'Alert when bus connection drops',           locked: true  },
    { key: 'agentStatus', label: 'Agent Status Changes',  desc: 'Agent goes online or offline',              locked: false },
    { key: 'missionUpd',  label: 'Mission Updates',       desc: 'Mission state transitions',                 locked: false },
] as const;

const ABOUT_ROWS = [
    { label: 'Version',   value: '2.0.0'              },
    { label: 'Framework', value: 'Vue 3 + Vite'       },
    { label: 'NATS',      value: 'nats.ws ^1.29'      },
    { label: 'Plugin',    value: 'CloudTAK Plugin API' },
    { label: 'Phase',     value: '5 — Edge & Control' },
];

type SectionId = typeof SETTINGS_SECTIONS[number]['id'];
const activeSection = ref<SectionId>('connection');

// ── NATS connection (Connection section) ─────────────────────────────────────
const { status, error, rtt, profiles, activeProfileId, connect, disconnect, addProfile, updateProfile, removeProfile } = useNatsStore();
const editingId = ref<string | null>(null);
const form = reactive({ label: '', wsUrl: '', user: '', pass: '' });
function startEdit(p: NatsProfile) { editingId.value = p.id; Object.assign(form, { label: p.label, wsUrl: p.wsUrl, user: p.user ?? '', pass: p.pass ?? '' }); }
function cancelEdit() { editingId.value = null; Object.assign(form, { label: '', wsUrl: '', user: '', pass: '' }); }
function saveForm() {
    if (editingId.value) updateProfile({ id: editingId.value, label: form.label, wsUrl: form.wsUrl, user: form.user || undefined, pass: form.pass || undefined });
    else addProfile({ id: crypto.randomUUID(), label: form.label, wsUrl: form.wsUrl, user: form.user || undefined, pass: form.pass || undefined });
    cancelEdit();
}
function connectTo(id: string) { connect(id); }

// ── Appearance ────────────────────────────────────────────────────────────────
function loadAppearance() {
    try { return JSON.parse(localStorage.getItem('omos-appearance') ?? 'null') ?? { density: 'normal', fontSize: 'medium', accent: '#4a9eff', navLabels: false }; }
    catch { return { density: 'normal', fontSize: 'medium', accent: '#4a9eff', navLabels: false }; }
}
const appearance = reactive<{ density: string; fontSize: string; accent: string; navLabels: boolean }>(loadAppearance());
function setAppearance(key: string, val: unknown) {
    (appearance as Record<string,unknown>)[key] = val;
    localStorage.setItem('omos-appearance', JSON.stringify(appearance));
}

// ── Notifications ─────────────────────────────────────────────────────────────
function loadNotifs(): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem('omos-notifications') ?? 'null') ?? {}; }
    catch { return {}; }
}
const notifs = reactive<Record<string, boolean>>({ desktop: true, sounds: false, critThreat: true, highThreat: true, natsDisconn: true, agentStatus: false, missionUpd: false, ...loadNotifs() });
function setNotif(key: string, val: boolean) { notifs[key] = val; localStorage.setItem('omos-notifications', JSON.stringify(notifs)); }
const notifPermission = ref(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied');
async function requestNotifPermission() { notifPermission.value = await Notification.requestPermission(); }
function testNotification() {
    if (notifPermission.value === 'granted') new Notification('OneMind OS', { body: 'Test notification from CloudTAK plugin', icon: '/favicon.ico' });
    else void requestNotifPermission();
}

// ── Profile ───────────────────────────────────────────────────────────────────
function loadProfile() { try { return JSON.parse(localStorage.getItem('omos-profile') ?? 'null') ?? { name: '', callsign: '', org: '' }; } catch { return { name: '', callsign: '', org: '' }; } }
const profile = reactive<{ name: string; callsign: string; org: string }>(loadProfile());
const profileInitial = computed(() => (profile.name || 'O').charAt(0).toUpperCase());
const profileSaved = ref(false);
function saveProfile() { localStorage.setItem('omos-profile', JSON.stringify(profile)); profileSaved.value = true; setTimeout(() => { profileSaved.value = false; }, 2000); }
</script>

<style scoped>
.nats-settings {
    display: flex; height: 100%; overflow: hidden;
    background: var(--cloudtak-panel-bg, rgba(13,17,23,0.98));
    color: #e6edf3; font-size: 12px;
}

/* Sidebar */
.ns-sidebar {
    width: 150px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.07);
    display: flex; flex-direction: column; padding: 10px 0; gap: 2px; overflow-y: auto;
    background: rgba(255,255,255,0.015);
}
.ns-sidebar-hd {
    padding: 2px 12px 8px; font-size: 9px; font-weight: 700; font-family: monospace;
    letter-spacing: 0.12em; color: rgba(255,255,255,0.25); text-transform: uppercase;
}
.ns-sidebar-btn {
    display: flex; align-items: center; gap: 7px; width: 100%; text-align: left;
    padding: 7px 12px; background: transparent; border: none; border-left: 2px solid transparent;
    color: rgba(255,255,255,0.4); font-size: 11px; cursor: pointer; transition: all .1s;
}
.ns-sidebar-btn:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.03); }
.ns-sidebar-btn.active { color: #4a9eff; border-left-color: #4a9eff; background: rgba(74,158,255,0.06); }

/* Content area */
.ns-content {
    flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;
}
.ns-section-hd {
    display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
    font-weight: 700; font-size: 12px; padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
}
.ns-icon { color: #4a9eff; }
.ns-mono { font-family: monospace; }
.ns-muted { color: rgba(255,255,255,0.35); font-size: 11px; }
.ns-error { color: #f85149; font-size: 11px; display: flex; align-items: center; gap: 5px; }
.ns-rtt   { color: rgba(255,255,255,0.3); font-size: 11px; }

/* Profiles */
.ns-profiles { display: flex; flex-direction: column; gap: 6px; }
.ns-profile { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; padding: 8px 10px; transition: border-color .12s; }
.ns-profile.connected { border-color: rgba(34,197,94,0.35); }
.nsp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.nsp-info { display: flex; flex-direction: column; gap: 2px; }
.nsp-label { font-weight: 600; font-size: 12px; }
.nsp-url   { font-family: monospace; font-size: 10px; color: rgba(255,255,255,0.35); }
.nsp-actions { display: flex; gap: 4px; }
.nsp-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; color: rgba(255,255,255,0.5); padding: 3px 8px; font-size: 10px; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: background .12s, color .12s; }
.nsp-btn:hover { background: rgba(255,255,255,0.1); color: #e6edf3; }
.nsp-btn:disabled { opacity: 0.3; cursor: default; }
.nsp-btn-connect { color: #22c55e; border-color: rgba(34,197,94,0.3); }
.nsp-btn-disconnect { color: #f59e0b; border-color: rgba(245,158,11,0.3); }
.nsp-btn-del:hover { color: #f85149; }

/* Form */
.ns-form { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.ns-form-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); }
.ns-fields { display: flex; flex-direction: column; gap: 5px; }
.ns-field-label { font-size: 10px; font-family: monospace; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 4px; }
.ns-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; color: #e6edf3; padding: 5px 9px; font-size: 12px; outline: none; width: 100%; }
.ns-input:focus { border-color: #4a9eff; }
.ns-input::placeholder { color: rgba(255,255,255,0.2); }
.ns-form-actions { display: flex; gap: 6px; }
.ns-btn { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 5px; color: rgba(255,255,255,0.6); padding: 4px 12px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.ns-btn:hover { background: rgba(255,255,255,0.12); color: #e6edf3; }
.ns-btn:disabled { opacity: 0.3; cursor: default; }
.ns-btn-save { color: #4a9eff; border-color: rgba(74,158,255,0.3); background: rgba(74,158,255,0.1); }

/* Appearance */
.ns-setting-group { display: flex; flex-direction: column; gap: 7px; }
.ns-group-label { font-size: 9px; font-weight: 700; font-family: monospace; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); text-transform: uppercase; }
.ns-options { display: flex; gap: 6px; flex-wrap: wrap; }
.ns-option { padding: 5px 14px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); font-size: 11px; cursor: pointer; transition: all .12s; }
.ns-option:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }
.ns-option.active { background: rgba(74,158,255,0.1); border-color: rgba(74,158,255,0.4); color: #4a9eff; }
.ns-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.ns-swatch { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; outline: 2px solid transparent; outline-offset: 3px; transition: outline .12s; }

/* Settings row (toggle) */
.ns-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.ns-row-label { font-size: 12px; font-weight: 500; }
.ns-row-desc { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; }
.ns-toggle { width: 34px; height: 18px; border-radius: 9px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); cursor: pointer; position: relative; flex-shrink: 0; transition: background .15s; padding: 0; }
.ns-toggle.on { background: rgba(74,158,255,0.3); border-color: rgba(74,158,255,0.5); }
.ns-toggle:disabled { opacity: 0.4; cursor: default; }
.ns-toggle-knob { position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: left .15s, background .15s; }
.ns-toggle.on .ns-toggle-knob { left: 18px; background: #4a9eff; }
.ns-notif-perm { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 7px; font-size: 11px; color: #f59e0b; }
.ns-test-btn { display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 6px; font-size: 11px; cursor: pointer; background: rgba(74,158,255,0.07); border: 1px solid rgba(74,158,255,0.2); color: #4a9eff; margin-top: 4px; }
.ns-test-btn:hover { background: rgba(74,158,255,0.13); }

/* Profile */
.ns-avatar-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; }
.ns-avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(74,158,255,0.15); border: 1px solid rgba(74,158,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #4a9eff; flex-shrink: 0; }
.ns-profile-name { font-size: 13px; font-weight: 600; }
.ns-profile-callsign { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; }

/* About */
.ns-about-hero { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; }
.ns-om-badge { width: 44px; height: 44px; border-radius: 10px; background: rgba(74,158,255,0.1); border: 1px solid rgba(74,158,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; font-family: monospace; color: #4a9eff; flex-shrink: 0; }
.ns-about-rows { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; }
.ns-about-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; }
.ns-about-row:last-child { border-bottom: none; }
.ns-about-links { display: flex; gap: 10px; flex-wrap: wrap; }
.ns-link { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #4a9eff; text-decoration: none; padding: 5px 10px; border: 1px solid rgba(74,158,255,0.2); border-radius: 5px; }
.ns-link:hover { background: rgba(74,158,255,0.08); }
.ns-about-quote { font-size: 10px; color: rgba(255,255,255,0.25); text-align: center; line-height: 1.6; font-style: italic; }
</style>
