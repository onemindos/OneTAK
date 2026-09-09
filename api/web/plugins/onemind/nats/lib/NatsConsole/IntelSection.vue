<template>
    <div class='it'>
        <div class='it-tabs'>
            <button
                v-for='tab in TABS'
                :key='tab.id'
                class='it-tab'
                :class='{ active: activeTab === tab.id }'
                @click='activeTab = tab.id'
            >
                <component
                    :is='tab.icon'
                    :size='11'
                />
                {{ tab.label }}
            </button>
        </div>

        <div class='it-body'>
            <!-- ── FEED ──────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "feed"'>
                <div class='it-panel-hd'>
                    <Newspaper
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>SIGINT FEED</span>
                    <span class='it-badge'>{{ intelItems.length }}</span>
                    <span
                        v-if='criticalIntel > 0'
                        class='it-badge crit'
                    >CRITICAL {{ criticalIntel }}</span>
                    <button
                        class='it-icon-btn'
                        :class='{ active: showFeedFilters }'
                        @click='showFeedFilters = !showFeedFilters'
                    >
                        <Filter :size='12' />
                    </button>
                    <div class='it-live-dot' />
                </div>
                <div
                    v-if='showFeedFilters'
                    class='it-filters'
                >
                    <div class='it-search-wrap'>
                        <Search
                            :size='11'
                            class='it-search-icon'
                        />
                        <input
                            v-model='feedSearch'
                            class='it-search'
                            placeholder='Search intel…'
                        >
                    </div>
                    <div class='it-filter-row'>
                        <button
                            v-for='lvl in RISK_LEVELS'
                            :key='lvl'
                            class='it-chip'
                            :class='{ active: riskFilter === lvl }'
                            @click='riskFilter = lvl'
                        >
                            {{ lvl }}
                        </button>
                    </div>
                </div>
                <div class='it-list'>
                    <div
                        v-if='filteredIntel.length === 0'
                        class='it-empty'
                    >
                        <Newspaper
                            :size='22'
                            class='it-empty-icon'
                        />
                        <span>AWAITING INTELLIGENCE…</span>
                        <span class='it-muted it-mono'>intel.&gt;</span>
                    </div>
                    <div
                        v-for='item in filteredIntel'
                        :key='item.id'
                        class='it-intel-row'
                    >
                        <button
                            class='it-intel-btn'
                            @click='expandedIntel = expandedIntel === item.id ? null : item.id'
                        >
                            <div class='it-intel-top'>
                                <span
                                    class='it-risk'
                                    :class='riskClass(item.riskScore)'
                                >{{ riskLabel(item.riskScore) }}</span>
                                <span class='it-source it-mono'>{{ item.source }}</span>
                                <MapPin
                                    v-if='item.location'
                                    :size='10'
                                    class='it-acc'
                                />
                                <span class='it-time it-mono'>{{ timeAgo(item.timestamp) }}</span>
                            </div>
                            <div class='it-intel-title'>
                                {{ item.title }}
                            </div>
                            <div
                                v-if='item.riskScore >= 8 && item.summary'
                                class='it-critical-summ'
                            >
                                <Zap :size='9' /> {{ item.summary.slice(0, 140) }}
                            </div>
                            <div
                                v-if='item.tags.length > 0'
                                class='it-tags'
                            >
                                <span
                                    v-for='tag in item.tags.slice(0,4)'
                                    :key='tag'
                                    class='it-tag'
                                >{{ tag }}</span>
                            </div>
                        </button>
                        <div
                            v-if='expandedIntel === item.id'
                            class='it-intel-detail'
                        >
                            <p v-if='item.summary'>
                                {{ item.summary }}
                            </p>
                            <p
                                v-if='item.location'
                                class='it-mono'
                            >
                                {{ item.location.name ?? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}` }}
                            </p>
                            <a
                                v-if='item.url'
                                :href='item.url'
                                target='_blank'
                                rel='noopener'
                                class='it-src-link'
                            >
                                <ExternalLink :size='10' /> SOURCE
                            </a>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ filteredIntel.length }} of {{ intelItems.length }} items</span>
                    <span class='it-mono'>LIVE • intel.&gt;</span>
                </div>
            </template>

            <!-- ── THREATS ────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "threats"'>
                <div class='it-panel-hd'>
                    <ShieldAlert
                        :size='13'
                        style='color:#f85149'
                    />
                    <span class='it-panel-title'>THREAT BOARD</span>
                    <span
                        v-if='criticalThreats > 0'
                        class='it-badge crit'
                    >CRITICAL {{ criticalThreats }}</span>
                    <span
                        v-if='unackCount > 0'
                        class='it-badge warn'
                    >{{ unackCount }} UNACK</span>
                    <div
                        class='it-live-dot'
                        :class='{ red: criticalThreats > 0 }'
                    />
                </div>
                <div class='it-filter-bar'>
                    <button
                        v-for='sev in SEV_LEVELS'
                        :key='sev'
                        class='it-chip'
                        :class='{ active: sevFilter === sev }'
                        @click='sevFilter = sev'
                    >
                        {{ sev }}
                    </button>
                </div>
                <div class='it-list'>
                    <div
                        v-if='filteredThreats.length === 0'
                        class='it-empty'
                    >
                        <ShieldAlert
                            :size='22'
                            class='it-empty-icon'
                        />
                        <span>NO ACTIVE THREATS</span>
                        <span class='it-muted it-mono'>evt.threat.&gt; + det.&gt;</span>
                    </div>
                    <div
                        v-for='alert in filteredThreats'
                        :key='alert.id'
                        class='it-alert'
                        :class='[alert.severity.toLowerCase(), { acked: alert.acknowledged }]'
                    >
                        <div
                            class='it-alert-dot'
                            :class='alert.severity.toLowerCase()'
                        />
                        <div class='it-alert-body'>
                            <div class='it-alert-top'>
                                <span
                                    class='it-sev'
                                    :class='alert.severity.toLowerCase()'
                                >{{ alert.severity }}</span>
                                <span class='it-mono'>{{ alert.type }}</span>
                                <span class='it-time it-mono'>{{ timeAgoS(alert.timestamp) }}</span>
                            </div>
                            <div class='it-alert-desc'>
                                {{ alert.description }}
                            </div>
                            <div class='it-alert-meta'>
                                <span
                                    class='it-mono'
                                    style='font-size:9px;color:rgba(255,255,255,0.25)'
                                >{{ alert.subject }}</span>
                                <button
                                    v-if='!alert.acknowledged'
                                    class='it-ack-btn'
                                    @click='acknowledgeAlert(alert)'
                                >
                                    <CheckCircle :size='10' /> ACK
                                </button>
                                <span
                                    v-else
                                    class='it-acked'
                                >ACKNOWLEDGED</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ threatAlerts.length }} total alerts</span>
                    <span class='it-mono'>LIVE • evt.threat.&gt; + det.&gt;</span>
                </div>
            </template>

            <!-- ── WORLD FEEDS ─────────────────────────────────────────────────── -->
            <template v-if='activeTab === "feeds"'>
                <div class='it-panel-hd'>
                    <Globe
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>WORLD FEEDS</span>
                    <span
                        class='it-badge'
                        :class='{ green: liveCount > 0 }'
                    >{{ liveCount }}/{{ feeds.length }} LIVE</span>
                    <span
                        v-if='totalFeedMsgs > 0'
                        class='it-badge'
                    >{{ totalFeedMsgs.toLocaleString() }} MSGS</span>
                </div>
                <div class='it-feeds-hdr'>
                    <span>Feed</span><span>Status</span><span>Rate</span><span>Last</span>
                </div>
                <div class='it-list'>
                    <div
                        v-for='(feed, idx) in feeds'
                        :key='feed.name'
                    >
                        <div
                            v-if='idx === 7'
                            class='it-feeds-divider'
                        >
                            INTEL FEEDS
                        </div>
                        <div class='it-feed-row'>
                            <div class='it-feed-name'>
                                <component
                                    :is='feedIcon(feed.name)'
                                    :size='13'
                                    :class='feed.status === "live" ? "it-acc" : "it-dim"'
                                />
                                <div>
                                    <div class='it-feed-label'>
                                        {{ feed.name }}
                                    </div>
                                    <div
                                        class='it-mono it-dim'
                                        style='font-size:9px'
                                    >
                                        {{ feed.subject }}
                                    </div>
                                </div>
                            </div>
                            <div class='it-feed-status'>
                                <div
                                    class='it-feed-dot'
                                    :class='feed.status'
                                />
                                <span
                                    class='it-chip-sm'
                                    :class='feed.status'
                                >{{ feed.status.toUpperCase() }}</span>
                            </div>
                            <div class='it-feed-rate'>
                                <template v-if='feed.status === "live" && feed.msgRate > 0'>
                                    <div class='it-rate-dot' />
                                    <span
                                        class='it-mono'
                                        style='color:#22c55e'
                                    >{{ fmtRate(feed.msgRate) }}</span>
                                </template>
                                <span
                                    v-else
                                    class='it-dim it-mono'
                                >—</span>
                            </div>
                            <span
                                class='it-mono it-dim'
                                style='font-size:10px'
                            >{{ timeAgoMs(feed.lastMessage) }}</span>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ totalFeedMsgs.toLocaleString() }} msgs</span>
                    <span class='it-mono'>{{ fmtRate(feeds.reduce((a,f) => a + f.msgRate, 0)) }} msg/s aggregate</span>
                </div>
            </template>

            <!-- ── AI ANALYST ──────────────────────────────────────────────────── -->
            <template v-if='activeTab === "analyst"'>
                <div class='it-panel-hd'>
                    <Brain
                        :size='13'
                        style='color:#d4af37'
                    />
                    <div>
                        <div class='it-panel-title'>
                            INTELLIGENCE ANALYST
                        </div>
                        <div
                            class='it-mono it-dim'
                            style='font-size:9px'
                        >
                            HERMES • agents.prompt.hermes.zeus • {{ nc ? 'ONLINE' : 'OFFLINE' }}
                        </div>
                    </div>
                    <button
                        v-if='analystMsgs.length > 0'
                        class='it-icon-btn'
                        title='Clear'
                        @click='analystMsgs = []'
                    >
                        <Trash2 :size='12' />
                    </button>
                </div>
                <div
                    ref='analystEl'
                    class='it-analyst-msgs'
                >
                    <div
                        v-if='analystMsgs.length === 0 && !analystLoading'
                        class='it-analyst-empty'
                    >
                        <div class='it-brain-icon'>
                            <Brain
                                :size='28'
                                style='color:#d4af37'
                            />
                        </div>
                        <div class='it-analyst-intro'>
                            <div
                                class='it-panel-title'
                                style='text-align:center'
                            >
                                INTELLIGENCE ANALYST READY
                            </div>
                            <div
                                class='it-muted it-mono'
                                style='font-size:10px;text-align:center;max-width:280px'
                            >
                                Routes queries to Hermes via agents.prompt.hermes.zeus. Analyzes live entity state, intel streams, and threat data.
                            </div>
                        </div>
                        <div class='it-suggestions'>
                            <div
                                class='it-dim it-mono'
                                style='font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;text-align:center'
                            >
                                SUGGESTED QUERIES
                            </div>
                            <button
                                v-for='q in SUGGESTED_QUERIES'
                                :key='q'
                                class='it-suggestion'
                                @click='analystInput = q'
                            >
                                <span style='color:#d4af37;margin-right:5px'>›</span>{{ q }}
                            </button>
                        </div>
                        <div class='it-analyst-conn'>
                            <div
                                class='it-conn-dot'
                                :class='{ active: !!nc }'
                            />
                            <span
                                :class='nc ? "it-green" : "it-dim"'
                                style='font-size:9px'
                                class='it-mono'
                            >
                                {{ nc ? 'HERMES CONNECTED' : 'NOT CONNECTED' }}
                            </span>
                        </div>
                    </div>
                    <div
                        v-for='msg in analystMsgs'
                        :key='msg.id'
                        class='it-amsg'
                        :class='msg.role'
                    >
                        <div
                            class='it-amsg-bubble'
                            :class='[msg.role, { error: msg.isError }]'
                        >
                            <div class='it-amsg-hd'>
                                <User
                                    v-if='msg.role === "user"'
                                    :size='11'
                                    style='color:#4a9eff'
                                />
                                <AlertTriangle
                                    v-else-if='msg.isError'
                                    :size='11'
                                    style='color:#f85149'
                                />
                                <Bot
                                    v-else
                                    :size='11'
                                    style='color:#d4af37'
                                />
                                <span
                                    class='it-mono'
                                    :style='{ color: msg.role === "user" ? "#4a9eff" : msg.isError ? "#f85149" : "#d4af37" }'
                                >
                                    {{ msg.role === 'user' ? 'OPERATOR' : 'ANALYST' }}
                                </span>
                                <span class='it-mono it-dim it-ml'>{{ fmtTime(msg.timestamp) }}</span>
                            </div>
                            <div
                                v-if='msg.role === "analyst" && !msg.isError'
                                class='it-amsg-content it-mono'
                                v-html='renderMd(msg.content)'
                            />
                            <div
                                v-else
                                class='it-amsg-content it-mono'
                                style='white-space:pre-wrap'
                            >
                                {{ msg.content }}
                            </div>
                        </div>
                    </div>
                    <div
                        v-if='analystLoading'
                        class='it-amsg analyst'
                    >
                        <div class='it-amsg-bubble analyst'>
                            <div class='it-amsg-hd'>
                                <Loader2
                                    :size='11'
                                    class='it-spin'
                                    style='color:#d4af37'
                                />
                                <span
                                    class='it-mono'
                                    style='color:#d4af37'
                                >ANALYZING INTELLIGENCE…</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='it-analyst-input'>
                    <div class='it-briefing-row'>
                        <button
                            class='it-briefing-btn'
                            :disabled='analystLoading || !nc'
                            @click='generateBriefing'
                        >
                            <Sparkles :size='11' /> GENERATE BRIEFING
                        </button>
                        <span
                            class='it-mono it-dim'
                            style='font-size:9px'
                        >SHIFT+ENTER for newline</span>
                    </div>
                    <div class='it-analyst-row'>
                        <textarea
                            ref='analystInputEl'
                            v-model='analystInput'
                            class='it-analyst-ta'
                            rows='2'
                            :placeholder='nc ? "Query the intelligence analyst…" : "NATS disconnected — connect first"'
                            :disabled='analystLoading || !nc'
                            @keydown='onAnalystKey'
                        />
                        <button
                            class='it-analyst-send'
                            :disabled='!analystInput.trim() || analystLoading || !nc'
                            @click='sendAnalystQuery'
                        >
                            <Send :size='13' />
                        </button>
                    </div>
                </div>
            </template>

            <!-- ── ENTITY GRAPH ────────────────────────────────────────────────── -->
            <template v-if='activeTab === "entity-graph"'>
                <div class='it-panel-hd'>
                    <Network
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>ENTITY GRAPH</span>
                    <span class='it-badge'>{{ entityNodes.size }} ENTITIES</span>
                    <div class='it-live-dot' />
                </div>
                <div class='it-filters'>
                    <div class='it-search-wrap'>
                        <Search
                            :size='11'
                            class='it-search-icon'
                        />
                        <input
                            v-model='entitySearch'
                            class='it-search'
                            placeholder='Search entities…'
                        >
                    </div>
                    <div class='it-filter-row'>
                        <button
                            v-for='t in ENTITY_TYPES'
                            :key='t'
                            class='it-chip'
                            :class='{ active: entityTypeFilter === t }'
                            @click='entityTypeFilter = t'
                        >
                            {{ t }}
                        </button>
                    </div>
                </div>
                <div class='it-list'>
                    <div
                        v-if='entityNodes.size === 0'
                        class='it-empty'
                    >
                        <Network
                            :size='22'
                            class='it-empty-icon'
                        />
                        <span>NO ENTITIES OBSERVED</span>
                        <span class='it-muted it-mono'>ent.&gt;</span>
                    </div>
                    <template
                        v-for='(group, gType) in filteredEntityGroups'
                        :key='gType'
                    >
                        <div class='it-ent-group-hd'>
                            <component
                                :is='entityTypeIcon(gType)'
                                :size='11'
                                :style='{ color: entityTypeColor(gType) }'
                            />
                            <span>{{ gType.toUpperCase() }}</span>
                            <span
                                class='it-badge'
                                style='margin-left:4px'
                            >{{ group.length }}</span>
                        </div>
                        <div
                            v-for='ent in group'
                            :key='ent.id'
                            class='it-ent-row'
                            :class='{ selected: selectedEntity === ent.id }'
                            @click='selectedEntity = selectedEntity === ent.id ? null : ent.id'
                        >
                            <div
                                class='it-ent-dot'
                                :style='{ background: entityTypeColor(ent.type) }'
                            />
                            <div class='it-ent-body'>
                                <div class='it-ent-id it-mono'>
                                    {{ ent.label || ent.id }}
                                </div>
                                <div
                                    v-if='ent.parent'
                                    class='it-ent-parent it-mono it-dim'
                                >
                                    parent: {{ ent.parent }}
                                </div>
                            </div>
                            <span class='it-time it-mono'>{{ timeAgo(ent.lastSeen) }}</span>
                        </div>
                        <div
                            v-if='selectedEntity && entityNodes.get(selectedEntity)'
                            class='it-ent-detail'
                        >
                            <pre class='it-raw-json'>{{ JSON.stringify(entityNodes.get(selectedEntity)!.raw, null, 2) }}</pre>
                        </div>
                    </template>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ entityNodes.size }} total entities</span>
                    <span class='it-mono'>LIVE • ent.&gt;</span>
                </div>
            </template>

            <!-- ── SOURCES ─────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "sources"'>
                <div class='it-panel-hd'>
                    <Database
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>FEED SOURCES</span>
                    <span class='it-badge'>{{ FEED_SOURCE_DEFS.length }} FEEDS</span>
                    <span class='it-badge green'>{{ enabledSourceCount }} ENABLED</span>
                </div>
                <div class='it-list'>
                    <div
                        v-for='feed in FEED_SOURCE_DEFS'
                        :key='feed.id'
                        class='it-src-card'
                        :class='{ expanded: expandedSource === feed.id }'
                    >
                        <div
                            class='it-src-hd'
                            @click='expandedSource = expandedSource === feed.id ? null : feed.id'
                        >
                            <component
                                :is='feed.icon'
                                :size='14'
                                :class='sourceEnabled(feed.id) ? "it-acc" : "it-dim"'
                            />
                            <div class='it-src-meta'>
                                <div class='it-src-name'>
                                    {{ feed.name }}
                                </div>
                                <div class='it-src-desc it-mono it-dim'>
                                    {{ feed.description }}
                                </div>
                            </div>
                            <div class='it-src-status'>
                                <div
                                    class='it-feed-dot'
                                    :class='sourceStatus(feed.id)'
                                />
                                <span
                                    class='it-chip-sm'
                                    :class='sourceStatus(feed.id)'
                                >{{ sourceStatus(feed.id).toUpperCase() }}</span>
                            </div>
                            <button
                                class='it-toggle'
                                :class='{ on: sourceEnabled(feed.id) }'
                                @click.stop='toggleSource(feed.id)'
                            >
                                {{ sourceEnabled(feed.id) ? 'ON' : 'OFF' }}
                            </button>
                            <ChevronDown
                                :size='12'
                                class='it-dim'
                                :style='{ transform: expandedSource === feed.id ? "rotate(180deg)" : "" }'
                            />
                        </div>
                        <div
                            v-if='expandedSource === feed.id'
                            class='it-src-settings'
                        >
                            <div
                                v-for='setting in feed.settings'
                                :key='setting.key'
                                class='it-src-field'
                            >
                                <label class='it-src-label it-mono'>{{ setting.label }}</label>
                                <input
                                    :type='setting.type === "password" ? "password" : "text"'
                                    :placeholder='setting.placeholder'
                                    :value='getSourceSetting(feed.id, setting.key)'
                                    class='it-search'
                                    @input='setSourceSetting(feed.id, setting.key, ($event.target as HTMLInputElement).value)'
                                >
                            </div>
                            <div class='it-src-actions'>
                                <button
                                    class='it-ack-btn'
                                    @click='publishSourceConfig(feed.id)'
                                >
                                    <Send :size='10' /> APPLY
                                </button>
                                <span
                                    v-if='sourcePollTime(feed.id)'
                                    class='it-mono it-dim'
                                    style='font-size:9px'
                                >
                                    last poll {{ sourcePollTime(feed.id) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ enabledSourceCount }}/{{ FEED_SOURCE_DEFS.length }} enabled</span>
                    <span class='it-mono'>config → cmd.intel.feed.{id}.config</span>
                </div>
            </template>

            <!-- ── ORP BROWSER ─────────────────────────────────────────────────── -->
            <template v-if='activeTab === "orp"'>
                <div class='it-panel-hd'>
                    <MapPin
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>ORP BROWSER</span>
                    <span class='it-badge'>{{ orpEntities.size }} ENTITIES</span>
                    <div class='it-live-dot' />
                </div>
                <div class='it-filters'>
                    <div class='it-search-wrap'>
                        <Search
                            :size='11'
                            class='it-search-icon'
                        />
                        <input
                            v-model='orpSearch'
                            class='it-search'
                            placeholder='Search operational reference points…'
                        >
                    </div>
                    <div class='it-filter-row'>
                        <button
                            v-for='t in ORP_TYPES'
                            :key='t'
                            class='it-chip'
                            :class='{ active: orpTypeFilter === t }'
                            @click='orpTypeFilter = t'
                        >
                            {{ t }}
                        </button>
                    </div>
                </div>
                <div class='it-orp-grid'>
                    <div class='it-orp-hdr'>
                        <span
                            :class='{ "it-sort-active": orpSort === "label" }'
                            class='it-mono it-sort-col'
                            @click='orpSort = "label"'
                        >NAME</span>
                        <span
                            :class='{ "it-sort-active": orpSort === "type" }'
                            class='it-mono it-sort-col'
                            @click='orpSort = "type"'
                        >TYPE</span>
                        <span
                            :class='{ "it-sort-active": orpSort === "lastSeen" }'
                            class='it-mono it-sort-col'
                            @click='orpSort = "lastSeen"'
                        >LAST SEEN</span>
                        <span class='it-mono'>COORDS</span>
                    </div>
                    <div
                        class='it-list'
                        style='flex:1'
                    >
                        <div
                            v-if='filteredOrp.length === 0'
                            class='it-empty'
                        >
                            <MapPin
                                :size='22'
                                class='it-empty-icon'
                            />
                            <span>NO ORP ENTITIES</span>
                            <span class='it-muted it-mono'>ent.orp.&gt;</span>
                        </div>
                        <div
                            v-for='orp in filteredOrp'
                            :key='orp.id'
                            class='it-orp-row'
                            :class='{ selected: selectedOrp === orp.id }'
                            @click='selectedOrp = selectedOrp === orp.id ? null : orp.id'
                        >
                            <div class='it-orp-name'>
                                <component
                                    :is='orpTypeIcon(orp.type)'
                                    :size='11'
                                    :style='{ color: entityTypeColor(orp.type) }'
                                />
                                <span>{{ orp.label || orp.id }}</span>
                            </div>
                            <span
                                class='it-chip-sm'
                                :style='{ background: entityTypeColor(orp.type) + "22", color: entityTypeColor(orp.type) }'
                            >{{ orp.type }}</span>
                            <span
                                class='it-mono it-dim'
                                style='font-size:10px'
                            >{{ timeAgo(orp.lastSeen) }}</span>
                            <div class='it-orp-coords'>
                                <span
                                    v-if='orp.lat != null'
                                    class='it-mono'
                                    style='font-size:9px'
                                >
                                    {{ orp.lat.toFixed(4) }}, {{ orp.lng?.toFixed(4) }}
                                </span>
                                <button
                                    v-if='orp.lat != null'
                                    class='it-copy-btn'
                                    @click.stop='copyCoords(orp)'
                                >
                                    <Copy :size='9' />
                                </button>
                            </div>
                        </div>
                        <div
                            v-if='selectedOrp'
                            class='it-orp-detail'
                        >
                            <pre class='it-raw-json'>{{ JSON.stringify(orpEntities.get(selectedOrp)?.raw, null, 2) }}</pre>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ filteredOrp.length }} of {{ orpEntities.size }} ORPs</span>
                    <span class='it-mono'>LIVE • ent.orp.&gt;</span>
                </div>
            </template>

            <!-- ── REGIONS ─────────────────────────────────────────────────────── -->
            <template v-if='activeTab === "regions"'>
                <div class='it-panel-hd'>
                    <Globe
                        :size='13'
                        class='it-acc'
                    />
                    <span class='it-panel-title'>REGION DOSSIER</span>
                    <span class='it-badge crit'>{{ criticalRegions }} CRITICAL</span>
                    <span class='it-badge warn'>{{ highRegions }} HIGH</span>
                </div>
                <div class='it-filters'>
                    <div class='it-search-wrap'>
                        <Search
                            :size='11'
                            class='it-search-icon'
                        />
                        <input
                            v-model='regionSearch'
                            class='it-search'
                            placeholder='Search regions…'
                        >
                    </div>
                </div>
                <div class='it-list'>
                    <div
                        v-for='region in filteredRegions'
                        :key='region.code'
                        class='it-region-row'
                    >
                        <button
                            class='it-region-btn'
                            @click='selectedRegion = selectedRegion === region.code ? null : region.code'
                        >
                            <div class='it-region-top'>
                                <span
                                    class='it-risk'
                                    :class='riskClass(region.liveRisk)'
                                >{{ riskLabel(region.liveRisk) }}</span>
                                <span class='it-source it-mono'>{{ region.code }}</span>
                                <span class='it-region-name'>{{ region.name }}</span>
                                <span class='it-time it-mono it-dim'>{{ region.region }}</span>
                            </div>
                            <div class='it-region-bar'>
                                <div
                                    class='it-region-fill'
                                    :style='{ width: (region.liveRisk / 10 * 100) + "%", background: riskColor(region.liveRisk) }'
                                />
                            </div>
                            <div class='it-region-meta'>
                                <span
                                    class='it-mono it-dim'
                                    style='font-size:9px'
                                >{{ region.intelCount }} intel items</span>
                                <span
                                    v-if='region.liveRisk !== region.baseRisk'
                                    class='it-mono'
                                    style='font-size:9px;color:#f59e0b'
                                >
                                    BASE {{ region.baseRisk.toFixed(1) }} → LIVE {{ region.liveRisk.toFixed(1) }}
                                </span>
                            </div>
                        </button>
                        <div
                            v-if='selectedRegion === region.code'
                            class='it-region-detail'
                        >
                            <div
                                v-if='region.recentItems.length === 0'
                                class='it-dim it-mono'
                                style='font-size:10px'
                            >
                                No recent intel items.
                            </div>
                            <div
                                v-for='item in region.recentItems'
                                :key='item.id'
                                class='it-region-intel'
                            >
                                <span
                                    class='it-risk'
                                    :class='riskClass(item.riskScore)'
                                    style='font-size:9px'
                                >{{ riskLabel(item.riskScore) }}</span>
                                <span
                                    class='it-mono'
                                    style='font-size:10px'
                                >{{ item.title.slice(0,100) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='it-footer'>
                    <span class='it-mono'>{{ filteredRegions.length }} regions</span>
                    <span class='it-mono'>blended with live intel.&gt;</span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import {
    Newspaper, Shield, Globe, Brain, Filter, Search, MapPin, ExternalLink, Zap,
    ShieldAlert, CheckCircle, Ship, Plane, Radio, Satellite, Cloud, AlertTriangle,
    Activity, Flame, Send, Sparkles, Bot, User, Trash2, Loader2,
    Network, Database, Copy, ChevronDown,
    Building2, User as UserIcon,
} from 'lucide-vue-next';
import { useNatsStore } from '../stores/nats.store';
import type { Subscription } from 'nats.ws';
import type { Component } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────

interface IntelItem {
    id: string; title: string; summary: string; source: string; domain: string;
    riskScore: number; timestamp: number; expires?: number;
    location?: { lat: number; lng: number; name?: string };
    tags: string[]; url?: string;
}

type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
interface ThreatAlert {
    id: string; type: string; severity: ThreatSeverity; description: string;
    subject: string; timestamp: number; acknowledged: boolean;
}

interface WorldFeed {
    name: string; subject: string; status: 'live' | 'paused';
    msgRate: number; lastMessage: number | null; totalMessages: number;
}

interface AnalystMsg { id: string; role: 'user' | 'analyst'; content: string; timestamp: number; isError?: boolean; }

interface EntityNode {
    id: string; type: string; label: string; parent?: string;
    lastSeen: number; raw: Record<string, unknown>;
}

interface OrpEntity {
    id: string; type: string; label: string;
    lat?: number; lng?: number; radius?: number; description?: string;
    lastSeen: number; raw: Record<string, unknown>;
}

interface SourceSetting { key: string; label: string; type: 'text' | 'number' | 'password'; placeholder?: string; }
interface FeedSourceDef { id: string; name: string; description: string; icon: Component; settings: SourceSetting[]; }

interface RegionRecord {
    code: string; name: string; region: string; baseRisk: number;
    liveRisk: number; intelCount: number; recentItems: IntelItem[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'feed',         label: 'Intel Feed',    icon: Newspaper  },
    { id: 'threats',      label: 'Threats',       icon: ShieldAlert },
    { id: 'feeds',        label: 'World Feeds',   icon: Globe       },
    { id: 'analyst',      label: 'AI Analyst',    icon: Brain       },
    { id: 'entity-graph', label: 'Entity Graph',  icon: Network     },
    { id: 'sources',      label: 'Sources',       icon: Database    },
    { id: 'orp',          label: 'ORP Browser',   icon: MapPin      },
    { id: 'regions',      label: 'Regions',       icon: Globe       },
] as const;

type TabId = (typeof TABS)[number]['id'];

const RISK_LEVELS = ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'LOW'] as const;
const SEV_LEVELS  = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

const ENTITY_TYPES = ['ALL', 'aircraft', 'vessel', 'drone', 'person', 'company', 'country', 'event', 'location', 'unknown'];

const ORP_TYPES = ['ALL', 'waypoint', 'boundary', 'objective', 'exclusion', 'vessel', 'aircraft', 'drone', 'person', 'location'];

const FEED_DEFINITIONS: Array<{ name: string; subject: string }> = [
    { name: 'AIS Ships',        subject: 'tel.ship.>'              },
    { name: 'ADS-B Aircraft',   subject: 'tel.aircraft.>'          },
    { name: 'APRS Trackers',    subject: 'tel.aprs.>'              },
    { name: 'Satellites',       subject: 'tel.satellite.>'         },
    { name: 'Weather',          subject: 'tel.weather.>'           },
    { name: 'Hazards',          subject: 'det.hazard.>'            },
    { name: 'World Events',     subject: 'intel.>'                 },
    { name: 'NOAA Weather',     subject: 'intel.weather.noaa.>'    },
    { name: 'USGS Seismic',     subject: 'intel.seismic.usgs.>'    },
    { name: 'ACLED Conflict',   subject: 'intel.conflict.acled.>'  },
    { name: 'NASA FIRMS Fire',  subject: 'intel.fire.nasa.firms.>' },
];

const FEED_ICONS: Record<string, Component> = {
    'AIS Ships': Ship, 'ADS-B Aircraft': Plane, 'APRS Trackers': Radio,
    'Satellites': Satellite, 'Weather': Cloud, 'Hazards': AlertTriangle,
    'World Events': Globe, 'NOAA Weather': Cloud, 'USGS Seismic': Activity,
    'ACLED Conflict': Shield, 'NASA FIRMS Fire': Flame,
};

const FEED_SOURCE_DEFS: FeedSourceDef[] = [
    {
        id: 'noaa', name: 'NOAA Weather', description: 'National Oceanic & Atmospheric Administration weather alerts', icon: Cloud,
        settings: [
            { key: 'poll_interval', label: 'Poll Interval (s)', type: 'number', placeholder: '300' },
            { key: 'areas', label: 'Areas (CSV)', type: 'text', placeholder: 'US,CA' },
        ],
    },
    {
        id: 'usgs', name: 'USGS Earthquakes', description: 'US Geological Survey real-time seismic event feed', icon: Activity,
        settings: [
            { key: 'poll_interval', label: 'Poll Interval (s)', type: 'number', placeholder: '60' },
            { key: 'min_magnitude', label: 'Min Magnitude', type: 'number', placeholder: '2.5' },
        ],
    },
    {
        id: 'acled', name: 'ACLED Conflicts', description: 'Armed Conflict Location & Event Data project', icon: Shield,
        settings: [
            { key: 'poll_interval', label: 'Poll Interval (s)', type: 'number', placeholder: '3600' },
            { key: 'api_key', label: 'API Key', type: 'password', placeholder: '••••••••••••••' },
            { key: 'email', label: 'Email', type: 'text', placeholder: 'ops@example.com' },
        ],
    },
    {
        id: 'firms', name: 'FIRMS Fire Data', description: 'NASA Fire Information for Resource Management System', icon: Flame,
        settings: [
            { key: 'poll_interval', label: 'Poll Interval (s)', type: 'number', placeholder: '600' },
            { key: 'api_key', label: 'API Key', type: 'password', placeholder: '••••••••••••••' },
            { key: 'area', label: 'Area', type: 'text', placeholder: 'world' },
            { key: 'days', label: 'Days Back', type: 'number', placeholder: '1' },
        ],
    },
];

const SUGGESTED_QUERIES = [
    'What are the top 3 active threats on the bus right now?',
    'Summarize recent entity detections by domain',
    'Assess risk level of current intel stream',
];

const STATIC_REGIONS = [
    { code: 'UA', name: 'Ukraine',     region: 'Europe',       baseRisk: 9 },
    { code: 'PS', name: 'Palestine',   region: 'Middle East',  baseRisk: 9 },
    { code: 'SD', name: 'Sudan',       region: 'Africa',       baseRisk: 8 },
    { code: 'YE', name: 'Yemen',       region: 'Middle East',  baseRisk: 8 },
    { code: 'MM', name: 'Myanmar',     region: 'Asia',         baseRisk: 7 },
    { code: 'SY', name: 'Syria',       region: 'Middle East',  baseRisk: 7 },
    { code: 'ML', name: 'Mali',        region: 'Africa',       baseRisk: 7 },
    { code: 'RU', name: 'Russia',      region: 'Europe',       baseRisk: 7 },
    { code: 'KP', name: 'North Korea', region: 'Asia',         baseRisk: 7 },
    { code: 'LY', name: 'Libya',       region: 'Africa',       baseRisk: 6 },
    { code: 'IR', name: 'Iran',        region: 'Middle East',  baseRisk: 6 },
    { code: 'CN', name: 'China',       region: 'Asia',         baseRisk: 4 },
];

const WINDOW_MS = 5000;

// ── State ────────────────────────────────────────────────────────────────────

const { nc, sc } = useNatsStore();
const activeTab   = ref<TabId>('feed');

// Feed
const intelItems      = ref<IntelItem[]>([]);
const expandedIntel   = ref<string | null>(null);
const riskFilter      = ref<string>('ALL');
const feedSearch      = ref('');
const showFeedFilters = ref(false);

// Threats
const threatAlerts  = ref<ThreatAlert[]>([]);
const sevFilter     = ref<string>('ALL');

// World feeds
const feeds       = ref<WorldFeed[]>(FEED_DEFINITIONS.map(f => ({ ...f, status: 'paused', msgRate: 0, lastMessage: null, totalMessages: 0 })));
const feedWindows = new Map<string, number[]>(FEED_DEFINITIONS.map(f => [f.subject, []]));
let rateInterval: ReturnType<typeof setInterval> | null = null;

// Analyst
const analystMsgs    = ref<AnalystMsg[]>([]);
const analystInput   = ref('');
const analystLoading = ref(false);
const analystEl      = ref<HTMLElement | null>(null);
const analystInputEl = ref<HTMLTextAreaElement | null>(null);
let analystCounter   = 0;

// Entity Graph
const entityNodes     = ref<Map<string, EntityNode>>(new Map());
const entitySearch    = ref('');
const entityTypeFilter = ref('ALL');
const selectedEntity  = ref<string | null>(null);

// ORP Browser
const orpEntities   = ref<Map<string, OrpEntity>>(new Map());
const orpSearch     = ref('');
const orpTypeFilter = ref('ALL');
const orpSort       = ref<'label' | 'type' | 'lastSeen'>('lastSeen');
const selectedOrp   = ref<string | null>(null);

// Sources
const sourceConfigs = ref<Record<string, Record<string, string>>>(
    JSON.parse(localStorage.getItem('omos-source-configs') ?? '{}')
);
const sourceStatuses = ref<Record<string, { lastPoll?: string; error?: string }>>({});
const expandedSource = ref<string | null>(null);
const enabledSources = ref<Record<string, boolean>>(
    JSON.parse(localStorage.getItem('omos-source-enabled') ?? '{}')
);

// Regions
const regionSearch  = ref('');
const selectedRegion = ref<string | null>(null);

let subs: Subscription[] = [];

// ── Parsing ──────────────────────────────────────────────────────────────────

function parseIntelMessage(subject: string, data: string): IntelItem | null {
    try {
        const p = JSON.parse(data) as Record<string, unknown>;
        const parts = subject.split('.');
        const subDomain = parts[1] ?? 'unknown';
        const subSource = parts[2] ?? 'unknown';
        const props = (p.properties && typeof p.properties === 'object' ? p.properties : {}) as Record<string, unknown>;
        const type = typeof p.type === 'string' ? p.type : '';
        const domainMap: Record<string, string> = { weather_alert:'weather', earthquake:'seismic', conflict_event:'conflict', wildfire:'fire' };
        const domain = type ? (domainMap[type] ?? subDomain) : subDomain;
        const title = (typeof p.title === 'string' ? p.title : undefined) ?? (props.headline as string) ?? (props.event as string) ?? subject;
        const summary = (typeof p.summary === 'string' ? p.summary : undefined) ?? (typeof p.description === 'string' ? p.description : undefined) ?? (props.description as string) ?? '';
        let riskScore = typeof p.risk_score === 'number' ? p.risk_score : typeof p.riskScore === 'number' ? p.riskScore : 3;
        if (!p.risk_score && !p.riskScore) {
            if (type === 'weather_alert') { const sev = (props.severity as string) ?? ''; riskScore = sev === 'Extreme' ? 9 : sev === 'Severe' ? 7 : sev === 'Moderate' ? 5 : 3; }
            else if (type === 'earthquake') { const m = (props.magnitude as number) ?? 0; riskScore = m >= 7 ? 9 : m >= 5 ? 7 : m >= 3 ? 5 : 2; }
            else if (type === 'conflict_event') { const f = (props.fatalities as number) ?? 0; riskScore = f > 10 ? 9 : f > 0 ? 7 : 5; }
            else if (type === 'wildfire') riskScore = 6;
        }
        const lat = typeof p.lat === 'number' ? p.lat : undefined;
        const lng = typeof p.lon === 'number' ? p.lon : typeof p.lng === 'number' ? p.lng : undefined;
        const location = lat != null && lng != null ? { lat, lng, name: typeof p.location === 'string' ? p.location : undefined } : undefined;
        let timestamp = Date.now();
        if (typeof p.timestamp === 'string') { const t = new Date(p.timestamp).getTime(); if (!isNaN(t)) timestamp = t; }
        else if (typeof p.timestamp === 'number') timestamp = p.timestamp;
        const tags = Array.isArray(p.tags) ? (p.tags as string[]).filter(t => typeof t === 'string') : [];
        return {
            id: typeof p.id === 'string' ? p.id : `${subject}-${Date.now()}`,
            title, summary, source: (typeof p.source === 'string' ? p.source : undefined) ?? subSource,
            domain, riskScore, timestamp, location, tags,
            url: typeof p.url === 'string' ? p.url : undefined,
        };
    } catch { return null; }
}

function parseThreatAlert(subject: string, data: string): ThreatAlert | null {
    try {
        const p = JSON.parse(data) as Record<string, unknown>;
        const rawSev = String(p.severity ?? 'LOW').toUpperCase() as ThreatSeverity;
        const sev: ThreatSeverity = ['CRITICAL','HIGH','MEDIUM','LOW'].includes(rawSev) ? rawSev : 'LOW';
        return {
            id: (p.id as string) ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            type: (p.type as string) ?? subject.split('.')[2] ?? 'UNKNOWN',
            severity: sev,
            description: (p.description as string) ?? (p.title as string) ?? subject,
            subject, timestamp: Date.now(), acknowledged: false,
        };
    } catch { return null; }
}

function parseEntityNode(subject: string, data: string): EntityNode | null {
    try {
        const p = JSON.parse(data) as Record<string, unknown>;
        const parts = subject.split('.');
        const type = parts[1] ?? 'unknown';
        const id = (p.id as string) ?? parts.slice(2).join('.') ?? subject;
        const label = (p.name as string) ?? (p.label as string) ?? (p.callsign as string) ?? id;
        const parent = (p.parent as string) ?? (p.missionId as string) ?? undefined;
        return { id, type, label, parent, lastSeen: Date.now(), raw: p };
    } catch { return null; }
}

function parseOrpEntity(subject: string, data: string): OrpEntity | null {
    try {
        const p = JSON.parse(data) as Record<string, unknown>;
        const parts = subject.split('.');
        const id = (p.id as string) ?? parts.slice(2).join('.') ?? subject;
        const type = (p.type as string) ?? (p.orp_type as string) ?? 'waypoint';
        return {
            id, type,
            label: (p.name as string) ?? (p.label as string) ?? id,
            lat: typeof p.lat === 'number' ? p.lat : undefined,
            lng: typeof p.lon === 'number' ? p.lon : typeof p.lng === 'number' ? p.lng : undefined,
            radius: typeof p.radius === 'number' ? p.radius : undefined,
            description: (p.description as string) ?? undefined,
            lastSeen: Date.now(), raw: p,
        };
    } catch { return null; }
}

// ── NATS subscriptions ───────────────────────────────────────────────────────

watch(nc, (conn) => {
    for (const s of subs) s.unsubscribe();
    subs = [];
    if (rateInterval) { clearInterval(rateInterval); rateInterval = null; }
    intelItems.value = [];
    threatAlerts.value = [];
    feeds.value = FEED_DEFINITIONS.map(f => ({ ...f, status: 'paused', msgRate: 0, lastMessage: null, totalMessages: 0 }));
    entityNodes.value = new Map();
    orpEntities.value = new Map();
    if (!conn) return;

    // Intel feed
    try {
        const sub = conn.subscribe('intel.>');
        subs.push(sub);
        (async () => {
            for await (const msg of sub) {
                const item = parseIntelMessage(msg.subject, sc.decode(msg.data));
                if (!item) continue;
                if (intelItems.value.some(i => i.id === item.id)) continue;
                const next = [item, ...intelItems.value];
                intelItems.value = next.length > 500 ? next.slice(0, 500) : next;
            }
        })().catch(() => {});
    } catch { /* ignore */ }

    // Threat feed
    for (const subj of ['evt.threat.>', 'det.>']) {
        try {
            const sub = conn.subscribe(subj);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    const alert = parseThreatAlert(msg.subject, sc.decode(msg.data));
                    if (!alert) continue;
                    if (threatAlerts.value.some(a => a.id === alert.id)) continue;
                    threatAlerts.value = [alert, ...threatAlerts.value].slice(0, 200);
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }

    // World feeds
    FEED_DEFINITIONS.forEach((def, idx) => {
        try {
            const sub = conn.subscribe(def.subject);
            subs.push(sub);
            (async () => {
                for await (const _ of sub) { void _;
                    const now = Date.now();
                    const win = feedWindows.get(def.subject) ?? [];
                    win.push(now);
                    feedWindows.set(def.subject, win);
                    const next = [...feeds.value];
                    next[idx] = { ...next[idx], status: 'live', lastMessage: now, totalMessages: Math.min((next[idx].totalMessages ?? 0) + 1, 999_999) };
                    feeds.value = next;
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    });

    rateInterval = setInterval(() => {
        const now = Date.now();
        feeds.value = feeds.value.map(f => {
            const win = (feedWindows.get(f.subject) ?? []).filter(t => t >= now - WINDOW_MS);
            feedWindows.set(f.subject, win);
            const rate = win.length / (WINDOW_MS / 1000);
            const status = f.lastMessage && now - f.lastMessage > 30_000 ? 'paused' : f.status;
            return { ...f, msgRate: rate, status };
        });
    }, 1000);

    // Entity Graph — subscribe ent.> but skip ent.orp.> (handled separately)
    try {
        const sub = conn.subscribe('ent.>');
        subs.push(sub);
        (async () => {
            for await (const msg of sub) {
                if (msg.subject.startsWith('ent.orp.')) continue;
                const node = parseEntityNode(msg.subject, sc.decode(msg.data));
                if (!node) continue;
                const map = new Map(entityNodes.value);
                map.set(node.id, node);
                if (map.size > 500) {
                    const oldest = [...map.entries()].sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0];
                    if (oldest) map.delete(oldest[0]);
                }
                entityNodes.value = map;
            }
        })().catch(() => {});
    } catch { /* ignore */ }

    // ORP Browser
    try {
        const sub = conn.subscribe('ent.orp.>');
        subs.push(sub);
        (async () => {
            for await (const msg of sub) {
                const orp = parseOrpEntity(msg.subject, sc.decode(msg.data));
                if (!orp) continue;
                const map = new Map(orpEntities.value);
                map.set(orp.id, orp);
                orpEntities.value = map;
            }
        })().catch(() => {});
    } catch { /* ignore */ }

    // Source statuses
    for (const feed of FEED_SOURCE_DEFS) {
        try {
            const sub = conn.subscribe(`intel.${feed.id}.status`);
            subs.push(sub);
            (async () => {
                for await (const msg of sub) {
                    try {
                        const raw = JSON.parse(sc.decode(msg.data)) as { last_poll_ts?: string; last_error?: string };
                        sourceStatuses.value = { ...sourceStatuses.value, [feed.id]: { lastPoll: raw.last_poll_ts, error: raw.last_error } };
                    } catch { /* ignore */ }
                }
            })().catch(() => {});
        } catch { /* ignore */ }
    }

}, { immediate: true });

// Auto-dismiss acked threats after 30s
const ackTimer = setInterval(() => {
    const now = Date.now();
    threatAlerts.value = threatAlerts.value.filter(a => !(a.acknowledged && now - a.timestamp > 30_000));
}, 5_000);

onUnmounted(() => {
    for (const s of subs) s.unsubscribe();
    if (rateInterval) clearInterval(rateInterval);
    clearInterval(ackTimer);
});

// ── Computed ─────────────────────────────────────────────────────────────────

const filteredIntel = computed(() => intelItems.value.filter(item => {
    if (riskFilter.value !== 'ALL' && riskLabel(item.riskScore) !== riskFilter.value) return false;
    if (feedSearch.value && !item.title.toLowerCase().includes(feedSearch.value.toLowerCase()) &&
        !item.source.toLowerCase().includes(feedSearch.value.toLowerCase())) return false;
    return true;
}));

const criticalIntel   = computed(() => intelItems.value.filter(i => i.riskScore >= 8).length);
const filteredThreats = computed(() =>
    sevFilter.value === 'ALL' ? threatAlerts.value : threatAlerts.value.filter(a => a.severity === sevFilter.value)
);
const criticalThreats = computed(() => threatAlerts.value.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length);
const unackCount      = computed(() => threatAlerts.value.filter(a => !a.acknowledged).length);
const liveCount       = computed(() => feeds.value.filter(f => f.status === 'live').length);
const totalFeedMsgs   = computed(() => feeds.value.reduce((a, f) => a + f.totalMessages, 0));

const filteredEntityGroups = computed(() => {
    const entries = [...entityNodes.value.values()];
    const filtered = entries.filter(e => {
        if (entityTypeFilter.value !== 'ALL' && e.type !== entityTypeFilter.value) return false;
        if (entitySearch.value && !e.id.toLowerCase().includes(entitySearch.value.toLowerCase()) &&
            !e.label.toLowerCase().includes(entitySearch.value.toLowerCase())) return false;
        return true;
    });
    const groups: Record<string, EntityNode[]> = {};
    for (const e of filtered) {
        if (!groups[e.type]) groups[e.type] = [];
        groups[e.type]!.push(e);
    }
    return groups;
});

const filteredOrp = computed(() => {
    const entries = [...orpEntities.value.values()];
    return entries
        .filter(e => {
            if (orpTypeFilter.value !== 'ALL' && e.type !== orpTypeFilter.value) return false;
            if (orpSearch.value && !e.label.toLowerCase().includes(orpSearch.value.toLowerCase()) &&
                !e.id.toLowerCase().includes(orpSearch.value.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (orpSort.value === 'label') return a.label.localeCompare(b.label);
            if (orpSort.value === 'type') return a.type.localeCompare(b.type);
            return b.lastSeen - a.lastSeen;
        });
});

const enabledSourceCount = computed(() =>
    FEED_SOURCE_DEFS.filter(f => enabledSources.value[f.id]).length
);

const regionData = computed<RegionRecord[]>(() =>
    STATIC_REGIONS.map(r => {
        const related = intelItems.value.filter(i =>
            i.domain.toLowerCase().includes(r.code.toLowerCase()) ||
            i.title.toLowerCase().includes(r.name.toLowerCase()) ||
            i.tags.some(t => t.toLowerCase().includes(r.name.toLowerCase()))
        );
        const boost = related.length > 0
            ? Math.min(related.reduce((a, b) => a + b.riskScore, 0) / related.length, 10) * 0.3
            : 0;
        return {
            ...r,
            liveRisk: Math.min(10, r.baseRisk * 0.7 + boost),
            intelCount: related.length,
            recentItems: related.slice(0, 3),
        };
    }).sort((a, b) => b.liveRisk - a.liveRisk)
);

const filteredRegions = computed(() =>
    regionSearch.value
        ? regionData.value.filter(r =>
            r.name.toLowerCase().includes(regionSearch.value.toLowerCase()) ||
            r.code.toLowerCase().includes(regionSearch.value.toLowerCase()) ||
            r.region.toLowerCase().includes(regionSearch.value.toLowerCase())
          )
        : regionData.value
);

const criticalRegions = computed(() => regionData.value.filter(r => r.liveRisk >= 8).length);
const highRegions     = computed(() => regionData.value.filter(r => r.liveRisk >= 6 && r.liveRisk < 8).length);

// ── Helpers ──────────────────────────────────────────────────────────────────

function riskLabel(score: number): string {
    if (score >= 8) return 'CRITICAL';
    if (score >= 6) return 'HIGH';
    if (score >= 4) return 'ELEVATED';
    return 'LOW';
}
function riskClass(score: number): string {
    if (score >= 8) return 'crit';
    if (score >= 6) return 'high';
    if (score >= 4) return 'elev';
    return 'low';
}
function riskColor(score: number): string {
    if (score >= 8) return '#f85149';
    if (score >= 6) return '#f59e0b';
    if (score >= 4) return 'rgba(255,255,255,0.3)';
    return '#22c55e';
}
function timeAgo(ts: number): string {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
}
function timeAgoS(ts: number): string {
    const s = Math.floor((Date.now() - ts) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;
}
function timeAgoMs(ts: number | null): string {
    if (!ts) return 'never';
    const s = Math.floor((Date.now() - ts) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;
}
function fmtRate(r: number): string {
    return r < 1 ? r.toFixed(2) : r < 10 ? r.toFixed(1) : r.toFixed(0);
}
function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function feedIcon(name: string): Component { return FEED_ICONS[name] ?? Globe; }

const ENTITY_TYPE_COLORS: Record<string, string> = {
    aircraft: '#00e5ff', vessel: '#00bcd4', company: '#d4af37', person: '#b388ff',
    country: '#76ff03', event: '#ff9500', sanction: '#ff1744', drone: '#ff6d00',
    location: '#00e676', unknown: '#888888', waypoint: '#4a9eff', boundary: '#f59e0b',
    objective: '#22c55e', exclusion: '#f85149',
};
const ENTITY_TYPE_ICONS: Record<string, Component> = {
    aircraft: Plane, vessel: Ship, drone: Radio, person: UserIcon, company: Building2,
    country: Globe, event: Newspaper, sanction: ShieldAlert, location: MapPin,
    unknown: Network, waypoint: MapPin, boundary: Globe, objective: Globe, exclusion: ShieldAlert,
};
function entityTypeColor(type: string): string { return ENTITY_TYPE_COLORS[type] ?? '#888'; }
function entityTypeIcon(type: string): Component { return ENTITY_TYPE_ICONS[type] ?? Network; }
function orpTypeIcon(type: string): Component { return ENTITY_TYPE_ICONS[type] ?? MapPin; }

function acknowledgeAlert(alert: ThreatAlert) {
    threatAlerts.value = threatAlerts.value.map(a => a.id === alert.id ? { ...a, acknowledged: true } : a);
    const conn = nc.value;
    if (conn) conn.publish(`cmd.alert.${alert.id}.ack`, new TextEncoder().encode(JSON.stringify({ id: alert.id, timestamp: Date.now() })));
}

function copyCoords(orp: OrpEntity) {
    if (orp.lat != null && orp.lng != null) {
        void navigator.clipboard.writeText(`${orp.lat.toFixed(6)},${orp.lng.toFixed(6)}`);
    }
}

// Sources
function sourceEnabled(id: string): boolean { return enabledSources.value[id] ?? false; }
function sourceStatus(id: string): 'live' | 'paused' {
    const s = sourceStatuses.value[id];
    return s?.lastPoll && !s.error ? 'live' : 'paused';
}
function sourcePollTime(id: string): string {
    const s = sourceStatuses.value[id];
    if (!s?.lastPoll) return '';
    try { return timeAgoMs(new Date(s.lastPoll).getTime()); } catch { return ''; }
}
function getSourceSetting(feedId: string, key: string): string {
    return sourceConfigs.value[feedId]?.[key] ?? '';
}
function setSourceSetting(feedId: string, key: string, value: string) {
    const cfg = { ...(sourceConfigs.value[feedId] ?? {}), [key]: value };
    sourceConfigs.value = { ...sourceConfigs.value, [feedId]: cfg };
    localStorage.setItem('omos-source-configs', JSON.stringify(sourceConfigs.value));
}
function toggleSource(id: string) {
    enabledSources.value = { ...enabledSources.value, [id]: !enabledSources.value[id] };
    localStorage.setItem('omos-source-enabled', JSON.stringify(enabledSources.value));
}
function publishSourceConfig(feedId: string) {
    const conn = nc.value;
    if (!conn) return;
    const cfg = { ...(sourceConfigs.value[feedId] ?? {}), enabled: enabledSources.value[feedId] ?? false };
    conn.publish(`cmd.intel.feed.${feedId}.config`, new TextEncoder().encode(JSON.stringify(cfg)));
}

function renderMd(text: string): string {
    return text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/### (.+)/g,'<b style="display:block;font-size:11px;color:#f59e0b;margin:8px 0 3px;text-transform:uppercase;letter-spacing:0.08em;">$1</b>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/^- (.+)/gm,'<div style="display:flex;gap:5px;margin:2px 0"><span style="color:#f59e0b;font-size:9px;margin-top:2px">◆</span><span>$1</span></div>')
        .replace(/\n/g,'<br>');
}

// ── Analyst ──────────────────────────────────────────────────────────────────

async function sendAnalystQuery() {
    const query = analystInput.value.trim();
    if (!query || analystLoading.value || !nc.value) return;
    analystInput.value = '';
    analystMsgs.value = [...analystMsgs.value, { id: `u-${++analystCounter}`, role: 'user', content: query, timestamp: Date.now() }];
    analystLoading.value = true;
    await nextTick(); scrollAnalyst();
    try {
        const resp = await nc.value.request('agents.prompt.hermes.zeus', new TextEncoder().encode(JSON.stringify({ query, timestamp: Date.now() })), { timeout: 15000 });
        const parsed = JSON.parse(new TextDecoder().decode(resp.data)) as Record<string, unknown>;
        if (parsed.error) throw new Error(parsed.error as string);
        const content = (parsed.analysis ?? parsed.response ?? new TextDecoder().decode(resp.data)) as string;
        analystMsgs.value = [...analystMsgs.value, { id: `a-${++analystCounter}`, role: 'analyst', content, timestamp: Date.now() }];
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Analysis failed';
        analystMsgs.value = [...analystMsgs.value, { id: `e-${++analystCounter}`, role: 'analyst', content: `INTELLIGENCE ANALYSIS ERROR\n\n${msg}`, timestamp: Date.now(), isError: true }];
    } finally {
        analystLoading.value = false;
        await nextTick(); scrollAnalyst();
        analystInputEl.value?.focus();
    }
}

async function generateBriefing() {
    if (analystLoading.value || !nc.value) return;
    analystInput.value = '';
    analystMsgs.value = [...analystMsgs.value, { id: `u-${++analystCounter}`, role: 'user', content: 'Generate a full intelligence briefing from current operational data on the NATS bus', timestamp: Date.now() }];
    analystLoading.value = true;
    await nextTick(); scrollAnalyst();
    try {
        const resp = await nc.value.request('agents.prompt.hermes.zeus', new TextEncoder().encode(JSON.stringify({ query: 'Generate a structured intelligence briefing. Include: active entity counts by type, recent high-risk intel items, active threats, recommended actions. Format as markdown.', timestamp: Date.now() })), { timeout: 15000 });
        const parsed = JSON.parse(new TextDecoder().decode(resp.data)) as Record<string, unknown>;
        if (parsed.error) throw new Error(parsed.error as string);
        const content = (parsed.analysis ?? parsed.response ?? '') as string;
        analystMsgs.value = [...analystMsgs.value, { id: `a-${++analystCounter}`, role: 'analyst', content, timestamp: Date.now() }];
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Briefing failed';
        analystMsgs.value = [...analystMsgs.value, { id: `e-${++analystCounter}`, role: 'analyst', content: `BRIEFING GENERATION ERROR\n\n${msg}`, timestamp: Date.now(), isError: true }];
    } finally {
        analystLoading.value = false;
        await nextTick(); scrollAnalyst();
    }
}

function scrollAnalyst() { if (analystEl.value) analystEl.value.scrollTop = analystEl.value.scrollHeight; }
function onAnalystKey(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendAnalystQuery(); } }
</script>

<style scoped>
.it { display:flex; flex-direction:column; height:100%; overflow:hidden; }
.it-tabs { display:flex; gap:1px; padding:0 8px; border-bottom:1px solid rgba(255,255,255,0.07); min-height:34px; align-items:center; flex-shrink:0; overflow-x:auto; }
.it-tabs::-webkit-scrollbar { height:0; }
.it-tab { display:flex; align-items:center; gap:5px; padding:5px 10px; background:none; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; color:rgba(255,255,255,0.4); font-size:11px; font-weight:500; cursor:pointer; white-space:nowrap; transition:color .12s; }
.it-tab:hover { color:rgba(255,255,255,0.7); }
.it-tab.active { color:#4a9eff; border-bottom-color:#4a9eff; }
.it-body { flex:1; overflow:hidden; display:flex; flex-direction:column; }

/* Shared */
.it-panel-hd { display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; background:rgba(255,255,255,0.02); }
.it-panel-title { font-size:11px; font-weight:700; font-family:monospace; letter-spacing:0.06em; color:#e6edf3; }
.it-badge { font-size:10px; padding:2px 7px; border-radius:4px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); font-weight:600; font-family:monospace; }
.it-badge.crit { background:rgba(248,81,73,0.15); border-color:rgba(248,81,73,0.3); color:#f85149; }
.it-badge.warn { background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#f59e0b; }
.it-badge.green { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:#22c55e; }
.it-acc { color:#4a9eff; }
.it-dim { color:rgba(255,255,255,0.3); }
.it-muted { color:rgba(255,255,255,0.35); font-size:11px; }
.it-mono { font-family:monospace; font-size:11px; }
.it-ml { margin-left:auto; }
.it-green { color:#22c55e; }
.it-live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 5px #22c55e; margin-left:auto; flex-shrink:0; }
.it-live-dot.red { background:#f85149; box-shadow:0 0 5px #f85149; }
.it-icon-btn { background:none; border:none; color:rgba(255,255,255,0.35); cursor:pointer; padding:3px; border-radius:4px; display:flex; transition:all .12s; }
.it-icon-btn:hover,.it-icon-btn.active { color:#e6edf3; background:rgba(255,255,255,0.07); }
.it-list { flex:1; overflow-y:auto; }
.it-footer { display:flex; align-items:center; justify-content:space-between; padding:5px 12px; border-top:1px solid rgba(255,255,255,0.07); flex-shrink:0; color:rgba(255,255,255,0.25); font-size:10px; font-family:monospace; }
.it-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:8px; color:rgba(255,255,255,0.3); font-size:11px; font-family:monospace; letter-spacing:0.06em; }
.it-empty-icon { opacity:0.2; }
.it-filters { padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:6px; flex-shrink:0; background:rgba(255,255,255,0.02); }
.it-filter-bar { display:flex; gap:4px; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.it-search-wrap { position:relative; }
.it-search-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,0.3); }
.it-search { width:100%; padding:5px 8px 5px 26px; border-radius:5px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#e6edf3; font-size:11px; font-family:monospace; outline:none; }
.it-search:focus { border-color:rgba(74,158,255,0.4); }
.it-filter-row { display:flex; gap:4px; flex-wrap:wrap; }
.it-chip { padding:2px 8px; border-radius:4px; font-size:10px; font-weight:500; font-family:monospace; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:transparent; color:rgba(255,255,255,0.4); transition:all .12s; letter-spacing:0.05em; }
.it-chip:hover { color:rgba(255,255,255,0.7); }
.it-chip.active { background:#4a9eff; color:#000; border-color:#4a9eff; }
.it-chip-sm { padding:1px 6px; border-radius:3px; font-size:9px; font-family:monospace; font-weight:600; letter-spacing:0.05em; }
.it-chip-sm.live { background:rgba(34,197,94,0.12); color:#22c55e; }
.it-chip-sm.paused { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.3); }

/* Intel feed */
.it-time { font-size:10px; margin-left:auto; color:rgba(255,255,255,0.3); }
.it-source { font-size:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px; color:rgba(255,255,255,0.4); }
.it-risk { font-size:10px; font-weight:700; font-family:monospace; padding:1px 6px; border-radius:3px; }
.it-risk.crit { background:rgba(248,81,73,0.15); color:#f85149; }
.it-risk.high { background:rgba(245,158,11,0.15); color:#f59e0b; }
.it-risk.elev { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.5); }
.it-risk.low  { background:rgba(34,197,94,0.1); color:#22c55e; }
.it-intel-row { border-bottom:1px solid rgba(255,255,255,0.04); }
.it-intel-btn { width:100%; text-align:left; padding:8px 12px; background:transparent; border:none; cursor:pointer; display:flex; flex-direction:column; gap:5px; transition:background .1s; }
.it-intel-btn:hover { background:rgba(255,255,255,0.02); }
.it-intel-top { display:flex; align-items:center; gap:6px; }
.it-intel-title { font-size:11px; color:#e6edf3; line-height:1.35; text-align:left; }
.it-critical-summ { display:flex; align-items:flex-start; gap:5px; background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.18); border-radius:4px; padding:4px 7px; font-size:10px; font-family:monospace; color:rgba(239,68,68,0.9); }
.it-tags { display:flex; flex-wrap:wrap; gap:3px; }
.it-tag { font-size:9px; font-family:monospace; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:1px 4px; border-radius:3px; color:rgba(255,255,255,0.4); }
.it-intel-detail { padding:6px 12px 10px; display:flex; flex-direction:column; gap:4px; font-size:11px; font-family:monospace; color:rgba(255,255,255,0.4); }
.it-src-link { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-family:monospace; color:#4a9eff; text-decoration:none; }
.it-src-link:hover { text-decoration:underline; }

/* Threats */
.it-alert { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.04); transition:opacity .2s; }
.it-alert.acked { opacity:0.4; }
.it-alert.critical { background:rgba(248,81,73,0.04); }
.it-alert-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; background:#555; }
.it-alert-dot.critical { background:#f85149; box-shadow:0 0 7px #f85149; }
.it-alert-dot.high { background:#f59e0b; }
.it-alert-dot.medium { background:#fbbf24; }
.it-alert-dot.low { background:#22c55e; }
.it-alert-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
.it-alert-top { display:flex; align-items:center; gap:7px; }
.it-sev { font-size:10px; font-weight:700; font-family:monospace; padding:1px 6px; border-radius:3px; }
.it-sev.critical { background:rgba(248,81,73,0.15); color:#f85149; }
.it-sev.high { background:rgba(245,158,11,0.15); color:#f59e0b; }
.it-sev.medium { background:rgba(251,191,36,0.15); color:#fbbf24; }
.it-sev.low { background:rgba(34,197,94,0.12); color:#22c55e; }
.it-alert-desc { font-size:11px; color:#e6edf3; }
.it-alert-meta { display:flex; align-items:center; gap:8px; }
.it-ack-btn { display:flex; align-items:center; gap:4px; padding:2px 8px; border-radius:4px; font-size:10px; font-family:monospace; font-weight:600; cursor:pointer; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); color:#22c55e; transition:all .12s; }
.it-ack-btn:hover { background:rgba(34,197,94,0.15); }
.it-acked { font-size:10px; font-family:monospace; color:#22c55e; }

/* World feeds */
.it-feeds-hdr { display:grid; grid-template-columns:1fr 90px 90px 80px; gap:6px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:9px; font-family:monospace; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.25); flex-shrink:0; }
.it-feeds-divider { display:flex; align-items:center; gap:8px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); font-size:9px; font-family:monospace; letter-spacing:0.08em; color:rgba(255,255,255,0.25); }
.it-feeds-divider::before,.it-feeds-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.07); }
.it-feed-row { display:grid; grid-template-columns:1fr 90px 90px 80px; gap:6px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.04); align-items:center; transition:background .1s; }
.it-feed-row:hover { background:rgba(255,255,255,0.02); }
.it-feed-name { display:flex; align-items:center; gap:7px; }
.it-feed-label { font-size:11px; font-family:monospace; color:#e6edf3; }
.it-feed-status { display:flex; align-items:center; gap:5px; }
.it-feed-dot { width:6px; height:6px; border-radius:50%; background:#444; }
.it-feed-dot.live { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.it-feed-rate { display:flex; align-items:center; gap:5px; }
.it-rate-dot { width:5px; height:5px; border-radius:50%; background:#22c55e; box-shadow:0 0 4px #22c55e; }

/* Analyst */
.it-analyst-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
.it-analyst-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:14px; }
.it-brain-icon { width:60px; height:60px; border-radius:14px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); display:flex; align-items:center; justify-content:center; }
.it-analyst-intro { display:flex; flex-direction:column; gap:6px; }
.it-suggestions { display:flex; flex-direction:column; gap:4px; width:100%; max-width:340px; }
.it-suggestion { padding:7px 12px; border-radius:6px; font-size:10px; font-family:monospace; text-align:left; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.45); transition:all .12s; }
.it-suggestion:hover { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.15); color:#e6edf3; }
.it-analyst-conn { display:flex; align-items:center; gap:6px; }
.it-conn-dot { width:7px; height:7px; border-radius:50%; background:#555; }
.it-conn-dot.active { background:#22c55e; box-shadow:0 0 4px #22c55e; }
.it-amsg { display:flex; }
.it-amsg.user { justify-content:flex-end; }
.it-amsg.analyst { justify-content:flex-start; }
.it-amsg-bubble { max-width:90%; padding:10px 13px; border-radius:10px; }
.it-amsg-bubble.user { background:rgba(0,229,255,0.07); border:1px solid rgba(0,229,255,0.18); border-bottom-right-radius:3px; }
.it-amsg-bubble.analyst { background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.12); border-bottom-left-radius:3px; }
.it-amsg-bubble.analyst.error { background:rgba(248,81,73,0.08); border-color:rgba(248,81,73,0.2); }
.it-amsg-hd { display:flex; align-items:center; gap:6px; margin-bottom:7px; }
.it-amsg-content { font-size:11px; line-height:1.55; color:#e6edf3; }
.it-analyst-input { flex-shrink:0; padding:10px; border-top:1px solid rgba(255,255,255,0.07); display:flex; flex-direction:column; gap:7px; }
.it-briefing-row { display:flex; align-items:center; gap:8px; }
.it-briefing-btn { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:5px; font-size:10px; font-family:monospace; font-weight:600; letter-spacing:0.06em; cursor:pointer; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); color:#d4af37; transition:all .12s; }
.it-briefing-btn:disabled { opacity:0.35; cursor:not-allowed; }
.it-briefing-btn:not(:disabled):hover { background:rgba(212,175,55,0.15); }
.it-analyst-row { display:flex; gap:8px; align-items:flex-end; }
.it-analyst-ta { flex:1; resize:none; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:7px; color:#e6edf3; font-size:11px; font-family:monospace; padding:8px 10px; outline:none; line-height:1.5; transition:border-color .12s; }
.it-analyst-ta:focus { border-color:rgba(74,158,255,0.4); }
.it-analyst-ta:disabled { opacity:0.4; }
.it-analyst-send { width:36px; height:36px; border-radius:7px; background:rgba(74,158,255,0.1); border:1px solid rgba(74,158,255,0.2); color:#4a9eff; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .12s; }
.it-analyst-send:disabled { opacity:0.3; cursor:not-allowed; }
.it-analyst-send:not(:disabled):hover { background:rgba(74,158,255,0.2); }
@keyframes spin { to { transform:rotate(360deg); } }
.it-spin { animation:spin 1s linear infinite; }

/* Entity Graph */
.it-ent-group-hd { display:flex; align-items:center; gap:6px; padding:5px 12px; background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.06); font-size:9px; font-family:monospace; letter-spacing:0.08em; color:rgba(255,255,255,0.35); }
.it-ent-row { display:flex; align-items:center; gap:8px; padding:7px 12px 7px 24px; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; transition:background .1s; }
.it-ent-row:hover { background:rgba(255,255,255,0.02); }
.it-ent-row.selected { background:rgba(74,158,255,0.06); }
.it-ent-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.it-ent-body { flex:1; min-width:0; }
.it-ent-id { font-size:11px; color:#e6edf3; }
.it-ent-parent { font-size:9px; }
.it-ent-detail { padding:8px 12px 10px 24px; background:rgba(0,0,0,0.2); border-bottom:1px solid rgba(255,255,255,0.06); }
.it-raw-json { font-family:monospace; font-size:9px; color:rgba(255,255,255,0.5); white-space:pre-wrap; word-break:break-all; max-height:140px; overflow-y:auto; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:6px 8px; margin:0; }

/* Sources */
.it-src-card { border-bottom:1px solid rgba(255,255,255,0.05); }
.it-src-hd { display:flex; align-items:center; gap:8px; padding:10px 12px; cursor:pointer; transition:background .1s; }
.it-src-hd:hover { background:rgba(255,255,255,0.02); }
.it-src-meta { flex:1; min-width:0; }
.it-src-name { font-size:11px; color:#e6edf3; }
.it-src-desc { font-size:9px; }
.it-src-status { display:flex; align-items:center; gap:4px; }
.it-toggle { padding:2px 8px; border-radius:4px; font-size:10px; font-family:monospace; font-weight:700; cursor:pointer; transition:all .12s; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.3); }
.it-toggle.on { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:#22c55e; }
.it-src-settings { padding:10px 12px; background:rgba(0,0,0,0.15); border-top:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:8px; }
.it-src-field { display:flex; flex-direction:column; gap:3px; }
.it-src-label { font-size:9px; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.35); }
.it-src-actions { display:flex; align-items:center; gap:8px; }

/* ORP Browser */
.it-orp-grid { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.it-orp-hdr { display:grid; grid-template-columns:1fr 80px 80px 100px; gap:6px; padding:5px 12px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.it-sort-col { cursor:pointer; transition:color .1s; }
.it-sort-col:hover { color:rgba(255,255,255,0.6); }
.it-sort-active { color:#4a9eff !important; }
.it-orp-row { display:grid; grid-template-columns:1fr 80px 80px 100px; gap:6px; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.04); align-items:center; cursor:pointer; transition:background .1s; }
.it-orp-row:hover { background:rgba(255,255,255,0.02); }
.it-orp-row.selected { background:rgba(74,158,255,0.05); }
.it-orp-name { display:flex; align-items:center; gap:6px; font-size:11px; color:#e6edf3; min-width:0; }
.it-orp-coords { display:flex; align-items:center; gap:4px; }
.it-copy-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.3); padding:1px; border-radius:3px; display:flex; transition:color .1s; }
.it-copy-btn:hover { color:#4a9eff; }
.it-orp-detail { padding:8px 12px; background:rgba(0,0,0,0.2); border-bottom:1px solid rgba(255,255,255,0.06); }

/* Regions */
.it-region-row { border-bottom:1px solid rgba(255,255,255,0.04); }
.it-region-btn { width:100%; text-align:left; padding:8px 12px; background:transparent; border:none; cursor:pointer; display:flex; flex-direction:column; gap:4px; transition:background .1s; }
.it-region-btn:hover { background:rgba(255,255,255,0.02); }
.it-region-top { display:flex; align-items:center; gap:6px; }
.it-region-name { font-size:11px; color:#e6edf3; flex:1; }
.it-region-bar { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
.it-region-fill { height:100%; border-radius:2px; transition:width .3s; }
.it-region-meta { display:flex; align-items:center; justify-content:space-between; }
.it-region-detail { padding:6px 12px 10px; background:rgba(0,0,0,0.15); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:4px; }
.it-region-intel { display:flex; align-items:center; gap:6px; padding:3px 0; }
</style>
