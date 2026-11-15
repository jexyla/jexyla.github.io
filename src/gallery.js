// Tilted WebGL column with one image per project: the current project's image in the centre, the previous
// and next projects' images peeking in above and below. Moving slides the column; planes bend with its speed.
import * as THREE from 'three';
import { gsap } from 'gsap';

const W = 1.3, H = 0.8125, PROJECT_GAP = 0.06;  // one image per project, like a film strip
const SIDE_SCALE = 0.68, SIDE_ALPHA = 0.38;   // previous and next: smaller and faded

const VERT = /* glsl */ `
  uniform float uBend;
  uniform float uShear;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += uBend * sin(uv.x * 3.14159265);   // bow the plane
    p.x += uShear * (uv.y - 0.5);            // lean with the motion
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uAlpha;
  uniform float uZoom;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, (vUv - 0.5) / uZoom + 0.5);   // the picture zooms inside its frame
    float e = smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.x)
            * smoothstep(0.0, 0.05, vUv.y) * smoothstep(0.0, 0.05, 1.0 - vUv.y);
    gl_FragColor = vec4(c.rgb * mix(0.9, 1.0, e), uAlpha);
    #include <colorspace_fragment>
  }
`;

// Light card colour behind each (often transparent) mock-up, tinted by the project's theme.
function cardColor(theme) {
  return '#' + new THREE.Color(theme.bg).lerp(new THREE.Color('#ffffff'), 0.82).getHexString();
}

// A 16:10 card: the image contained on a tinted background; brand cover art when there's no image.
function cardTexture(src, theme, coverCanvas, assetsReady, fit) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // If the image has an opaque background, fill the card with its corner colour so the edge disappears.
  const edgeColor = img => {
    try {
      const s = document.createElement('canvas');
      s.width = s.height = 4;
      const sg = s.getContext('2d');
      sg.drawImage(img, 0, 0, 4, 4, 0, 0, 4, 4);
      const [r, gr, b, a] = sg.getImageData(1, 1, 1, 1).data;
      return a > 250 ? `rgb(${r},${gr},${b})` : null;
    } catch { return null; }
  };
  const paint = (img, pad = 0.1) => {
    const edge = img && img.naturalWidth && edgeColor(img);
    if (edge) pad = 0.02;   // the image carries its own background: let it fill the card
    g.fillStyle = edge || cardColor(theme);
    g.fillRect(0, 0, c.width, c.height);
    if (img) {
      // fit 'height': the image runs the card's full height, so a picture cropped at its top and bottom
      // has its cut edges on the card's edges.
      const s = fit === 'height' && img !== coverCanvas
        ? c.height / img.height
        : Math.min((c.width * (1 - pad * 2)) / img.width, (c.height * (1 - pad * 2)) / img.height);
      const w = img.width * s, h = img.height * s;
      g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    }
    tex.needsUpdate = true;
  };
  const useCover = () => {
    paint(coverCanvas, 0.08);
    assetsReady.then(() => paint(coverCanvas, 0.08));   // repaint once brand fonts and logos are in
  };
  if (!src) {
    useCover();
  } else {
    paint(null);
    const img = new Image();
    img.onload = () => paint(img);
    img.onerror = useCover;
    img.src = src;
  }
  return tex;
}

export function createGallery(canvas, projects, { reduceMotion, coverCanvas, assetsReady }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 4);

  const column = new THREE.Group();   // tilted and placed in the viewport
  const track = new THREE.Group();    // slides vertically between projects
  column.add(track);
  scene.add(column);

  const shared = { uBend: { value: 0 }, uShear: { value: 0 }, uZoom: { value: 1 } };
  const geo = new THREE.PlaneGeometry(W, H, 40, 20);
  const stops = [];
  let y = 0;
  projects.forEach((p, pi) => {
    stops.push(y + H / 2);   // this project's image centred in view
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: cardTexture(p.images[0] || null, p.theme, coverCanvas(pi), assetsReady, p.imageFit) }, uAlpha: { value: 1 }, uBend: shared.uBend, uShear: shared.uShear, uZoom: shared.uZoom },
      transparent: true,
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -(y + H / 2);
    mesh.userData.index = pi;
    track.add(mesh);
    y += H + PROJECT_GAP;
  });

  let baseScale = 1;
  function frame() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visW = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    if (w < 700) {
      column.position.set(0.05, -0.78, 0);   // below the text on phones (long summaries)
      baseScale = 0.72;
    } else {
      // Keep the column clear of the text block: it ends at left (7vw, max 120px) + width (38vw, max 540px).
      const textRight = (Math.min(w * 0.07, 120) + Math.min(w * 0.38, 540)) / w;   // fraction of the width
      const leftEdge = (textRight - 0.5) * visW;                                     // world x just right of the text
      const room = visW / 2 - 0.13 - leftEdge;                                        // up to just short of the dots
      baseScale = THREE.MathUtils.clamp(room / 1.12, 0.55, 1.45);                    // the tilted column is ~1.12–1.22 wide
      column.position.set(leftEdge + 0.56 * baseScale + 0.14, 0, 0);   // nudged right, towards the dots
    }
    column.scale.setScalar(baseScale * zoom.frame);
  }
  // Moving between projects: the strip zooms out (frames shrink while the pictures zoom in inside them),
  // then zooms back in as the next project arrives.
  const zoom = { frame: 1 };
  frame();
  addEventListener('resize', frame);

  const state = { y: stops[0] };
  let lastY = state.y, velocity = 0;
  function goTo(i, instant = false) {
    gsap.killTweensOf(state);
    gsap.killTweensOf(zoom);
    if (instant || reduceMotion) { state.y = stops[i]; zoom.frame = 1; return; }
    gsap.to(state, { y: stops[i], duration: 1.1, ease: 'power3.inOut' });
    gsap.timeline()
      .to(zoom, { frame: 0.78, duration: 0.5, ease: 'power2.out' })
      .to(zoom, { frame: 1, duration: 0.75, ease: 'power3.inOut' });
  }

  const tilt = { x: 0, y: 0 }, tiltTarget = { x: 0, y: 0 };
  addEventListener('pointermove', e => {
    tiltTarget.x = (e.clientY / innerHeight - 0.5) * 0.1;
    tiltTarget.y = (e.clientX / innerWidth - 0.5) * 0.1;
  });

  // Film strip: the image at the centre is full size and opaque; the further an image is from the centre,
  // the smaller and more faded it gets.
  function filmStrip() {
    for (const mesh of track.children) {
      const d = Math.abs(mesh.position.y + track.position.y) / (H + PROJECT_GAP);   // 0 at the centre, 1 one slot away
      const t = Math.max(0, 1 - d);
      mesh.scale.setScalar(SIDE_SCALE + (1 - SIDE_SCALE) * t);
      mesh.material.uniforms.uAlpha.value = SIDE_ALPHA + (1 - SIDE_ALPHA) * t;
    }
  }

  // Index of the project whose image is under a screen point, or -1.
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitProject(x, y) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(track.children, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  renderer.setAnimationLoop(() => {
    track.position.y = state.y;
    column.scale.setScalar(baseScale * zoom.frame);
    shared.uZoom.value = 1 + (1 - zoom.frame) * 0.7;   // frame at 0.78 → picture at ~1.15
    filmStrip();
    const v = state.y - lastY;
    lastY = state.y;
    velocity += (v - velocity) * 0.2;
    if (!reduceMotion) {
      shared.uBend.value = THREE.MathUtils.clamp(velocity * 16, -0.35, 0.35);
      shared.uShear.value = THREE.MathUtils.clamp(velocity * 7, -0.15, 0.15);
      tilt.x += (tiltTarget.x - tilt.x) * 0.05;
      tilt.y += (tiltTarget.y - tilt.y) * 0.05;
    }
    column.rotation.set(0.12 + tilt.x, -0.42 + tilt.y, 0.04);
    renderer.render(scene, camera);
  });

  return { goTo, hitProject };
}
