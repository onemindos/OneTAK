// Three.js scene + WebXR renderer lifecycle manager.
// Initialized once per XR overlay mount; torn down on unmount.

import type * as THREEType from 'three'

let renderer: THREEType.WebGLRenderer | null = null
let scene:    THREEType.Scene | null = null
let camera:   THREEType.PerspectiveCamera | null = null

type FrameCallback = (delta: number) => void
const frameCallbacks: FrameCallback[] = []
let lastTime = 0

export async function initScene(canvas: HTMLCanvasElement): Promise<{
    renderer: THREEType.WebGLRenderer
    scene:    THREEType.Scene
    camera:   THREEType.PerspectiveCamera
}> {
    const THREE = await import('three')

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    renderer.xr.enabled = true
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace

    scene = new THREE.Scene()

    // Lighting for 3D Tiles content
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(1, 2, 1).normalize().multiplyScalar(1e6)
    scene.add(sun)

    camera = new THREE.PerspectiveCamera(
        60,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        2_000_000,
    )
    camera.position.set(0, 10, 100)

    renderer.setAnimationLoop((time: number) => {
        const delta = (time - lastTime) / 1000
        lastTime = time
        for (const cb of frameCallbacks) cb(delta)
        if (renderer && scene && camera) renderer.render(scene, camera)
    })

    return { renderer, scene, camera }
}

export function onFrame(cb: FrameCallback): () => void {
    frameCallbacks.push(cb)
    return () => {
        const i = frameCallbacks.indexOf(cb)
        if (i !== -1) frameCallbacks.splice(i, 1)
    }
}

export function resizeRenderer(width: number, height: number): void {
    if (!renderer || !camera) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}

export function destroyScene(): void {
    if (renderer) {
        renderer.setAnimationLoop(null)
        renderer.dispose()
        renderer = null
    }
    scene  = null
    camera = null
    frameCallbacks.length = 0
    lastTime = 0
}

export const getRenderer = () => renderer
export const getScene    = () => scene
export const getCamera   = () => camera
