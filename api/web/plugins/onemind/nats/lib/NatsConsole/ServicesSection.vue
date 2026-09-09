<template>
    <div class='sv'>
        <!-- Header -->
        <div class='sv-hd'>
            <LayoutGrid
                :size='13'
                class='sv-acc'
            />
            <span class='sv-title'>SERVICE CATALOG</span>
            <span class='sv-badge'>{{ filteredTiles.length }}</span>
            <div class='sv-search-wrap'>
                <Search
                    :size='11'
                    class='sv-search-icon'
                />
                <input
                    v-model='search'
                    class='sv-search'
                    placeholder='Search services…'
                >
                <button
                    v-if='search'
                    class='sv-clear-btn'
                    @click='search = ""'
                >
                    <X :size='10' />
                </button>
            </div>
            <button
                class='sv-icon-btn'
                title='Add service'
                @click='openAdd'
            >
                <Plus :size='13' />
            </button>
            <button
                class='sv-icon-btn'
                title='Export'
                @click='exportServices'
            >
                <Download :size='13' />
            </button>
        </div>

        <!-- Recently opened -->
        <div
            v-if='recentlyOpened.length > 0'
            class='sv-recent'
        >
            <Clock
                :size='10'
                class='sv-dim'
            />
            <span class='sv-dim sv-mono'>RECENT:</span>
            <button
                v-for='id in recentlyOpened'
                :key='id'
                class='sv-recent-chip'
                @click='openService(getTile(id))'
            >
                {{ getTile(id)?.name ?? id }}
            </button>
        </div>

        <!-- Category filter -->
        <div class='sv-cats'>
            <button
                class='sv-cat'
                :class='{ active: activeCat === "" }'
                @click='activeCat = ""'
            >
                ALL
            </button>
            <button
                v-for='cat in categories'
                :key='cat'
                class='sv-cat'
                :class='{ active: activeCat === cat }'
                @click='activeCat = cat'
            >
                {{ cat }}
            </button>
        </div>

        <!-- Grid -->
        <div class='sv-body'>
            <div
                v-if='filteredTiles.length === 0'
                class='sv-empty'
            >
                <Search
                    :size='22'
                    style='opacity:0.2'
                />
                <span class='sv-mono sv-dim'>NO SERVICES MATCH</span>
            </div>

            <template
                v-for='cat in visibleCategories'
                :key='cat'
            >
                <div class='sv-cat-label'>
                    {{ cat }}
                </div>
                <div class='sv-grid'>
                    <div
                        v-for='tile in tilesForCat(cat)'
                        :key='tile.id'
                        class='sv-card'
                        :class='{ pinned: pinnedIds.includes(tile.id) }'
                    >
                        <div class='sv-card-top'>
                            <span class='sv-emoji'>{{ tile.emoji ?? '🔗' }}</span>
                            <div class='sv-card-info'>
                                <div class='sv-card-name'>
                                    {{ tile.name }}
                                </div>
                                <div class='sv-card-url sv-mono'>
                                    {{ domain(tile.url) }}
                                </div>
                            </div>
                            <div
                                class='sv-status-dot'
                                :class='statusClass(tile.id)'
                                :title='statusText(tile.id)'
                            />
                        </div>
                        <div class='sv-card-desc'>
                            {{ tile.description }}
                        </div>
                        <div class='sv-card-actions'>
                            <button
                                class='sv-open-btn'
                                @click='openService(tile)'
                            >
                                <ExternalLink :size='10' /> OPEN
                            </button>
                            <button
                                class='sv-icon-sm'
                                :title='pinnedIds.includes(tile.id) ? "Unpin" : "Pin"'
                                @click='togglePin(tile.id)'
                            >
                                <Star
                                    :size='10'
                                    :fill='pinnedIds.includes(tile.id) ? "currentColor" : "none"'
                                />
                            </button>
                            <button
                                v-if='tile.custom'
                                class='sv-icon-sm'
                                title='Edit'
                                @click='openEdit(tile)'
                            >
                                <Pencil :size='10' />
                            </button>
                            <button
                                v-if='tile.custom'
                                class='sv-icon-sm sv-danger'
                                title='Delete'
                                @click='deleteTile(tile.id)'
                            >
                                <Trash2 :size='10' />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Add/Edit modal -->
        <div
            v-if='modalOpen'
            class='sv-overlay'
            @click.self='modalOpen = false'
        >
            <div class='sv-modal'>
                <div class='sv-modal-hd'>
                    <span class='sv-title'>{{ editingTile ? 'EDIT SERVICE' : 'ADD SERVICE' }}</span>
                    <button
                        class='sv-icon-btn'
                        @click='modalOpen = false'
                    >
                        <X :size='13' />
                    </button>
                </div>
                <div class='sv-modal-body'>
                    <label class='sv-label'>Name</label>
                    <input
                        v-model='form.name'
                        class='sv-input'
                        placeholder='My Service'
                    >
                    <label class='sv-label'>URL</label>
                    <input
                        v-model='form.url'
                        class='sv-input'
                        placeholder='https://…'
                    >
                    <label class='sv-label'>Category</label>
                    <input
                        v-model='form.category'
                        class='sv-input'
                        placeholder='Observability'
                        list='sv-cats-list'
                    >
                    <datalist id='sv-cats-list'>
                        <option
                            v-for='c in categories'
                            :key='c'
                            :value='c'
                        />
                    </datalist>
                    <label class='sv-label'>Description</label>
                    <input
                        v-model='form.description'
                        class='sv-input'
                        placeholder='Short description'
                    >
                    <label class='sv-label'>Emoji</label>
                    <input
                        v-model='form.emoji'
                        class='sv-input'
                        placeholder='🔗'
                        maxlength='4'
                    >
                </div>
                <div class='sv-modal-ft'>
                    <button
                        class='sv-cancel-btn'
                        @click='modalOpen = false'
                    >
                        Cancel
                    </button>
                    <button
                        class='sv-save-btn'
                        :disabled='!form.name || !form.url'
                        @click='saveForm'
                    >
                        <Check :size='11' /> {{ editingTile ? 'Save' : 'Add' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, onMounted } from 'vue';
import { LayoutGrid, Search, Plus, X, Star, Clock, ExternalLink, Pencil, Trash2, Download, Check } from 'lucide-vue-next';

interface ServiceTile {
    id: string; name: string; description: string; url: string;
    accent?: string; emoji?: string; category: string; custom?: boolean;
}
type StatusState = 'online' | 'offline' | 'unknown';

const DEFAULTS: ServiceTile[] = [
    { id: 'grafana',       name: 'Grafana',          description: 'Metrics, logs & traces',            url: 'https://grafana.onemindos.dev',                              emoji: '📊', category: 'Observability' },
    { id: 'prometheus',    name: 'Prometheus',        description: 'Metrics engine',                    url: 'https://grafana.tail717ba0.ts.net',                          emoji: '🔥', category: 'Observability' },
    { id: 'hubble',        name: 'Hubble',            description: 'Cilium network flow visualization', url: 'https://hubble.tail717ba0.ts.net',                           emoji: '🔭', category: 'Observability' },
    { id: 'uptime-kuma',   name: 'Uptime Kuma',       description: 'Service uptime monitor',            url: 'http://146.190.143.195:3001',                                emoji: '💓', category: 'Observability' },
    { id: 'argocd',        name: 'ArgoCD',            description: 'GitOps continuous delivery',        url: 'https://argocd.onemindos.dev',                               emoji: '🚀', category: 'Platform' },
    { id: 'authentik',     name: 'Authentik',         description: 'SSO & identity provider',           url: 'https://auth.onemindos.dev',                                 emoji: '🛡️', category: 'Platform' },
    { id: 'orp',           name: 'ORP',               description: 'Entity resolution & intelligence',  url: 'https://orp.tail717ba0.ts.net',                              emoji: '🧠', category: 'Platform' },
    { id: 'clickhouse',    name: 'ClickHouse',        description: 'OLAP analytics database',           url: 'https://grafana.tail717ba0.ts.net',                          emoji: '🗄️', category: 'Platform' },
    { id: 'nats-mon',      name: 'NATS Monitor',      description: 'NATS server monitoring',            url: 'https://nats-mon.onemindos.dev',                             emoji: '📈', category: 'Platform' },
    { id: 'cloudtak',      name: 'CloudTAK',          description: 'TAK server & WebTAK COP',           url: 'https://cloudtak.onemindos.dev',                             emoji: '🎯', category: 'Tactical' },
    { id: 'wwv',           name: 'WorldWideView',     description: 'Strategic globe & orbital view',    url: 'https://wwv.onemindos.dev',                                  emoji: '🌍', category: 'Tactical' },
    { id: 'takserver',     name: 'TAK Server',        description: 'Tactical awareness server',         url: 'https://152.42.155.95:8446',                                 emoji: '📡', category: 'Tactical' },
    { id: 'hermes',        name: 'Hermes',            description: 'AI agent & workflow UI',            url: 'https://hermes.onemindos.dev',                               emoji: '⚡', category: 'Agents' },
    { id: 'hermes-webui',  name: 'Hermes WebUI',      description: 'Hermes web interface',              url: 'https://hermes.tail717ba0.ts.net',                           emoji: '🖥️', category: 'Agents' },
    { id: 'hermes-local',  name: 'Hermes Local',      description: 'Hermes running on MacBook',         url: 'http://omos-mbp.tail717ba0.ts.net:8787',                     emoji: '💻', category: 'Agents' },
    { id: 'hermes-agent',  name: 'Hermes Dashboard',  description: 'Agent monitoring dashboard',       url: 'https://hermes-agent.tail717ba0.ts.net',                     emoji: '📡', category: 'Agents' },
    { id: 'letta',         name: 'Letta',             description: 'Stateful agent framework',          url: 'https://app.letta.com',                                      emoji: '🤖', category: 'Agents' },
    { id: 'aws',           name: 'AWS',               description: 'Amazon Web Services console',       url: 'https://us-east-1.console.aws.amazon.com/console/',          emoji: '☁️', category: 'Cloud' },
    { id: 'digitalocean',  name: 'DigitalOcean',      description: 'DOKS cluster & cloud infra',        url: 'https://cloud.digitalocean.com/kubernetes/clusters',         emoji: '🌊', category: 'Cloud' },
    { id: 'gcp',           name: 'Google Cloud',      description: 'GCP console',                       url: 'https://console.cloud.google.com',                           emoji: '🔵', category: 'Cloud' },
    { id: 'azure',         name: 'Azure',             description: 'Microsoft Azure portal',            url: 'https://portal.azure.com',                                   emoji: '⬡', category: 'Cloud' },
    { id: 'cloudflare',    name: 'Cloudflare',        description: 'CDN, DNS & tunnel management',      url: 'https://dash.cloudflare.com',                                emoji: '🟠', category: 'Cloud' },
    { id: 'tailscale',     name: 'Tailscale',         description: 'Mesh VPN admin',                    url: 'https://login.tailscale.com/admin/machines',                 emoji: '🔒', category: 'Cloud' },
    { id: 'synadia',       name: 'Synadia NGS',       description: 'Global NATS network',               url: 'https://app.ngs.global',                                     emoji: '🌐', category: 'Cloud' },
    { id: 'gh-onemind',    name: 'GitHub / OneMind',  description: 'OneMind OS organization',           url: 'https://github.com/onemindos',                               emoji: '🐙', category: 'Dev' },
    { id: 'gh-zeus',       name: 'GitHub / Zeus',     description: 'Personal GitHub profile',           url: 'https://github.com/Zeus-Delacruz',                           emoji: '🐙', category: 'Dev' },
    { id: 'composio',      name: 'Composio',          description: 'Agent integrations',                url: 'https://dashboard.composio.dev/onemind/~/connect/apps',      emoji: '🔌', category: 'Dev' },
    { id: 'zeus-site',     name: 'Zeus Delacruz',     description: 'Personal site',                     url: 'https://zeusdelacruz.com',                                   emoji: '⭐', category: 'Identity & Ops' },
    { id: 'onemind-site',  name: 'OneMind OS',        description: 'Public site',                       url: 'https://weareonemind.com',                                   emoji: '🚀', category: 'Identity & Ops' },
    { id: 'cloudflare-d',  name: 'Cloudflare DNS',    description: 'DNS management',                    url: 'https://dash.cloudflare.com',                                emoji: '🌐', category: 'Identity & Ops' },
    { id: 'gohighlevel',   name: 'GoHighLevel',       description: 'CRM & marketing platform',          url: 'https://app.gohighlevel.com',                                emoji: '🎯', category: 'Identity & Ops' },
    { id: 'mercury',       name: 'Mercury Bank',      description: 'Business banking',                  url: 'https://app.mercury.com/panorama',                           emoji: '💳', category: 'Identity & Ops' },
    { id: '1password',     name: '1Password',         description: 'Password manager',                  url: 'https://my.1password.com',                                   emoji: '🔑', category: 'Personal' },
    { id: 'todoist',       name: 'Todoist',           description: 'Tasks & project management',        url: 'https://todoist.com/app',                                    emoji: '✅', category: 'Personal' },
    { id: 'fastmail',      name: 'Fastmail',          description: 'Email & calendar',                  url: 'https://app.fastmail.com',                                   emoji: '📬', category: 'Personal' },
    { id: 'protonmail',    name: 'Proton Mail',       description: 'Encrypted email',                   url: 'https://mail.proton.me',                                     emoji: '🔒', category: 'Personal' },
    { id: 'raindrop',      name: 'Raindrop.io',       description: 'Bookmarks & read later',            url: 'https://app.raindrop.io',                                    emoji: '🔖', category: 'Personal' },
];

const STORAGE_KEY  = 'omos-services-v1';
const PINNED_KEY   = 'omos-services-pinned';
const RECENT_KEY   = 'omos-recently-opened';

function loadTiles(): ServiceTile[] {
    try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) as ServiceTile[]; } catch { /* ignore */ }
    return [...DEFAULTS];
}
function saveTiles(t: ServiceTile[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ } }
function loadPinned(): string[] { try { return JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]') as string[]; } catch { return []; } }
function savePinned(p: string[]) { try { localStorage.setItem(PINNED_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
function loadRecent(): string[] { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; } catch { return []; } }
function saveRecent(r: string[]) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch { /* ignore */ } }

const tiles        = ref<ServiceTile[]>(loadTiles());
const pinnedIds    = ref<string[]>(loadPinned());
const recentlyOpened = ref<string[]>(loadRecent());
const statuses     = ref<Record<string, StatusState>>({});
const search       = ref('');
const activeCat    = ref('');
const modalOpen    = ref(false);
const editingTile  = ref<ServiceTile | null>(null);
const form         = ref({ name: '', url: '', category: '', description: '', emoji: '' });

const allTiles = computed(() => {
    const pinned = tiles.value.filter(t => pinnedIds.value.includes(t.id));
    const rest = tiles.value.filter(t => !pinnedIds.value.includes(t.id));
    return [...pinned, ...rest];
});

const categories = computed(() => {
    const s = new Set(tiles.value.map(t => t.category));
    return Array.from(s).sort();
});

const filteredTiles = computed(() => allTiles.value.filter(t => {
    if (activeCat.value && t.category !== activeCat.value) return false;
    if (search.value) {
        const q = search.value.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.url.toLowerCase().includes(q);
    }
    return true;
}));

const visibleCategories = computed(() => {
    if (activeCat.value) return [activeCat.value];
    return categories.value.filter(c => filteredTiles.value.some(t => t.category === c));
});

function tilesForCat(cat: string): ServiceTile[] {
    return filteredTiles.value.filter(t => t.category === cat);
}
function getTile(id: string): ServiceTile | undefined {
    return tiles.value.find(t => t.id === id);
}
function domain(url: string): string {
    try { return new URL(url).hostname; } catch { return url; }
}
function statusClass(id: string): string {
    return statuses.value[id] ?? 'unknown';
}
function statusText(id: string): string {
    const s = statuses.value[id] ?? 'unknown';
    return s === 'online' ? 'Online' : s === 'offline' ? 'Offline' : 'Status unknown';
}

function openService(tile: ServiceTile | undefined) {
    if (!tile) return;
    window.open(tile.url, '_blank', 'noopener');
    const recent = [tile.id, ...recentlyOpened.value.filter(id => id !== tile.id)].slice(0, 5);
    recentlyOpened.value = recent;
    saveRecent(recent);
}
function togglePin(id: string) {
    const next = pinnedIds.value.includes(id) ? pinnedIds.value.filter(p => p !== id) : [...pinnedIds.value, id];
    pinnedIds.value = next;
    savePinned(next);
}
function deleteTile(id: string) {
    const next = tiles.value.filter(t => t.id !== id);
    tiles.value = next;
    saveTiles(next);
}
function openAdd() {
    editingTile.value = null;
    form.value = { name: '', url: '', category: activeCat.value, description: '', emoji: '' };
    modalOpen.value = true;
}
function openEdit(tile: ServiceTile) {
    editingTile.value = tile;
    form.value = { name: tile.name, url: tile.url, category: tile.category, description: tile.description, emoji: tile.emoji ?? '' };
    modalOpen.value = true;
}
function saveForm() {
    if (!form.value.name || !form.value.url) return;
    if (editingTile.value) {
        tiles.value = tiles.value.map(t => t.id === editingTile.value!.id ? { ...t, ...form.value } : t);
    } else {
        const newTile: ServiceTile = { id: `custom-${Date.now()}`, ...form.value, custom: true };
        tiles.value = [...tiles.value, newTile];
    }
    saveTiles(tiles.value);
    modalOpen.value = false;
}
function exportServices() {
    const data = JSON.stringify(tiles.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'omos-services.json';
    a.click();
}

async function checkStatus(tile: ServiceTile) {
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        await fetch(tile.url, { method: 'HEAD', mode: 'no-cors', signal: ctrl.signal });
        clearTimeout(t);
        statuses.value = { ...statuses.value, [tile.id]: 'online' };
    } catch {
        statuses.value = { ...statuses.value, [tile.id]: 'offline' };
    }
}

onMounted(() => {
    // Spot-check a few key services
    const toCheck = tiles.value.filter(t =>
        ['grafana','argocd','cloudtak','wwv','hermes','nats-mon'].includes(t.id)
    );
    toCheck.forEach(t => void checkStatus(t));
});
</script>

<style scoped>
.sv { display:flex; flex-direction:column; height:100%; overflow:hidden; position:relative; }
.sv-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); flex-wrap:wrap; }
.sv-title { font-size:11px; font-weight:700; font-family:monospace; letter-spacing:0.06em; color:#e6edf3; }
.sv-badge { font-size:10px; padding:2px 7px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); font-weight:600; font-family:monospace; }
.sv-acc { color:#4a9eff; }
.sv-dim { color:rgba(255,255,255,0.3); }
.sv-mono { font-family:monospace; }
.sv-search-wrap { flex:1; min-width:140px; max-width:260px; position:relative; }
.sv-search-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); }
.sv-clear-btn { position:absolute; right:6px; top:50%; transform:translateY(-50%); background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; padding:2px; display:flex; }
.sv-search { width:100%; padding:4px 24px 4px 26px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.sv-search:focus { border-color:rgba(74,158,255,0.4); }
.sv-icon-btn { background:none; border:none; color:rgba(255,255,255,0.35); cursor:pointer; padding:4px; border-radius:4px; display:flex; transition:all .12s; }
.sv-icon-btn:hover { color:#e6edf3; background:rgba(255,255,255,0.07); }
.sv-recent { display:flex; align-items:center; gap:6px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; overflow-x:auto; }
.sv-recent::-webkit-scrollbar { height:0; }
.sv-recent-chip { padding:2px 8px; border-radius:4px; font-size:10px; font-family:monospace; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); cursor:pointer; white-space:nowrap; transition:all .12s; }
.sv-recent-chip:hover { color:#e6edf3; border-color:rgba(255,255,255,0.2); }
.sv-cats { display:flex; gap:2px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; overflow-x:auto; }
.sv-cats::-webkit-scrollbar { height:0; }
.sv-cat { padding:3px 9px; border-radius:4px; font-size:10px; font-family:monospace; font-weight:600; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.07); color:rgba(255,255,255,0.4); transition:all .12s; white-space:nowrap; letter-spacing:0.04em; }
.sv-cat:hover { color:rgba(255,255,255,0.7); }
.sv-cat.active { background:#4a9eff; color:#000; border-color:#4a9eff; }
.sv-body { flex:1; overflow-y:auto; padding:10px 12px; }
.sv-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; gap:10px; }
.sv-cat-label { font-size:10px; font-family:monospace; font-weight:700; letter-spacing:0.08em; color:rgba(255,255,255,0.25); text-transform:uppercase; padding:10px 0 5px; border-top:1px solid rgba(255,255,255,0.05); margin-top:4px; }
.sv-cat-label:first-child { border-top:none; margin-top:0; }
.sv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; margin-bottom:4px; }
.sv-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:6px; transition:all .12s; }
.sv-card:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); }
.sv-card.pinned { border-color:rgba(245,158,11,0.25); background:rgba(245,158,11,0.04); }
.sv-card-top { display:flex; align-items:center; gap:8px; }
.sv-emoji { font-size:20px; line-height:1; flex-shrink:0; }
.sv-card-info { flex:1; min-width:0; }
.sv-card-name { font-size:11px; font-weight:600; color:#e6edf3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sv-card-url { font-size:10px; color:rgba(255,255,255,0.3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sv-status-dot { width:7px; height:7px; border-radius:50%; background:#444; flex-shrink:0; }
.sv-status-dot.online { background:#22c55e; box-shadow:0 0 5px #22c55e; }
.sv-status-dot.offline { background:#f85149; }
.sv-status-dot.unknown { background:#555; }
.sv-card-desc { font-size:11px; color:rgba(255,255,255,0.4); line-height:1.4; }
.sv-card-actions { display:flex; align-items:center; gap:4px; margin-top:2px; }
.sv-open-btn { display:flex; align-items:center; gap:4px; padding:3px 9px; border-radius:4px; font-size:10px; font-family:monospace; font-weight:600; cursor:pointer; background:rgba(74,158,255,0.1); border:1px solid rgba(74,158,255,0.2); color:#4a9eff; transition:all .12s; flex:1; justify-content:center; }
.sv-open-btn:hover { background:rgba(74,158,255,0.2); }
.sv-icon-sm { background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer; padding:4px; border-radius:4px; display:flex; transition:all .12s; }
.sv-icon-sm:hover { color:#e6edf3; }
.sv-icon-sm.sv-danger:hover { color:#f85149; }
.sv-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:100; }
.sv-modal { background:rgba(13,17,23,0.98); border:1px solid rgba(255,255,255,0.12); border-radius:10px; width:340px; max-width:calc(100% - 32px); }
.sv-modal-hd { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.07); }
.sv-modal-body { padding:16px; display:flex; flex-direction:column; gap:8px; }
.sv-label { font-size:10px; font-family:monospace; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.07em; }
.sv-input { padding:7px 10px; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e6edf3; font-size:11px; font-family:monospace; outline:none; transition:border-color .12s; }
.sv-input:focus { border-color:rgba(74,158,255,0.4); }
.sv-modal-ft { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid rgba(255,255,255,0.07); }
.sv-cancel-btn { padding:6px 14px; border-radius:6px; font-size:11px; font-family:monospace; background:transparent; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); cursor:pointer; }
.sv-save-btn { display:flex; align-items:center; gap:5px; padding:6px 14px; border-radius:6px; font-size:11px; font-family:monospace; font-weight:600; background:rgba(74,158,255,0.1); border:1px solid rgba(74,158,255,0.3); color:#4a9eff; cursor:pointer; transition:all .12s; }
.sv-save-btn:disabled { opacity:0.35; cursor:not-allowed; }
.sv-save-btn:not(:disabled):hover { background:rgba(74,158,255,0.2); }
</style>
