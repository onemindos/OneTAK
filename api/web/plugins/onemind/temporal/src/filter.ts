const TAK_LAYER_PREFIXES = ['cot-', 'entity-', 'tak-']

function isTakLayer(id: string): boolean {
    return TAK_LAYER_PREFIXES.some(p => id.startsWith(p))
}

export function applyTemporalFilter(map: any, start: number, end: number): void {
    const style = map.getStyle()
    if (!style?.layers) return

    for (const layer of style.layers) {
        if (!isTakLayer(layer.id)) continue
        try {
            map.setFilter(layer.id, [
                'all',
                ['>=', ['to-number', ['get', 'timestamp']], start],
                ['<=', ['to-number', ['get', 'timestamp']], end],
            ])
        } catch (_) {
            // layer doesn't support expression filters, skip
        }
    }
}

export function clearTemporalFilter(map: any): void {
    const style = map.getStyle()
    if (!style?.layers) return

    for (const layer of style.layers) {
        if (!isTakLayer(layer.id)) continue
        try { map.setFilter(layer.id, null) } catch (_) {}
    }
}
