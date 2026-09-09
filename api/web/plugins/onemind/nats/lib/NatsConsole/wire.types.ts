// wire.types.ts — Badge classification for NATS subjects
// Ported from omos-ui WirePage.tsx — identical badge logic, zero React deps

export type Badge =
    | 'HB'       // heartbeat
    | 'PROMPT'   // outbound prompt
    | 'CHUNK'    // response chunk (inbox)
    | 'TEL'      // telemetry
    | 'CMD'      // command
    | 'EVT'      // event
    | 'DET'      // detection
    | 'ENT'      // entity state
    | 'SVC'      // RPC / microservice
    | 'SYS'      // $SYS / $JS advisory
    | 'MSG'      // generic

export const ALL_BADGES: Badge[] = [
    'HB','PROMPT','CHUNK','TEL','CMD','EVT','DET','ENT','SVC','SYS','MSG'
];

export const BADGE_STYLE: Record<Badge, { color: string; bg: string }> = {
    HB:     { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
    PROMPT: { color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
    CHUNK:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    TEL:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    CMD:    { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    EVT:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    DET:    { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    ENT:    { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    SVC:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    SYS:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    MSG:    { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

export function inferBadge(subject: string): Badge {
    if (subject.startsWith('agents.hb.') || subject.startsWith('agents.heartbeat.'))  return 'HB';
    if (subject.startsWith('agents.prompt.'))                                          return 'PROMPT';
    if (subject.startsWith('_INBOX.') || subject.startsWith('_inbox.'))               return 'CHUNK';
    if (subject.startsWith('tel.'))                                                    return 'TEL';
    if (subject.startsWith('cmd.'))                                                    return 'CMD';
    if (subject.startsWith('evt.'))                                                    return 'EVT';
    if (subject.startsWith('det.'))                                                    return 'DET';
    if (subject.startsWith('ent.'))                                                    return 'ENT';
    if (subject.startsWith('svc.'))                                                    return 'SVC';
    if (subject.startsWith('$SYS.') || subject.startsWith('$JS.'))                    return 'SYS';
    return 'MSG';
}
