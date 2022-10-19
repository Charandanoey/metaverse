import * as THREE from "./libs/three.module.js";
import { ARButton } from "./libs/ARButton.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const arButton = ARButton.createButton(renderer, {
  optionalFeatures: ["hit-test"],
});
document.body.appendChild(arButton);

renderer.xr.addEventListener("sessionstart", async () => {
  renderer.xr.enabled = true;

  const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
  reticleGeometry.rotateX(-Math.PI / 2);
  const reticleMaterial = new THREE.MeshBasicMaterial();
  const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.visible = false;
  reticle.matrixAutoUpdate = false;
  scene.add(reticle);

  const session = renderer.xr.getSession();
  const viewerSpace = await session.requestReferenceSpace("viewer");
  const hitTestSource = await session.requestHitTestSource({
    space: viewerSpace,
  });

  const light = new THREE.HemisphereLight("#ffffff", "#000000", 1);
  scene.add(light);

  const controller = renderer.xr.getController(0);
  scene.add(controller);

  let meshes = [];
  controller.addEventListener("select", () => {
    const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const material = new THREE.MeshPhongMaterial({ color: "#0000ff" });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.translateZ(-0.5);
    // mesh.applyMatrix4(controller.matrixWorld);
    mesh.getWorldPosition.setFromMatrixPosition(reticle.matrix);
    scene.add(mesh);
    meshes.push(mesh);
  });

  renderer.setAnimationLoop((timestamp, frame) => {
    if (!frame) return;

    const hitTestResult = frame.getHitTestResults(hitTestSource);

    reticle.visible = hitTestResult.lenght > 0;
    if (hitTestResult.lenght > 0) {
      const hit = hitTestResult[0];
      const refSpace = renderer.xr.getReferenceSpace();
      const hitPose = hit.getPose(refSpace);
      reticle.matrix.fromArray(hitPose.tranfrom.matrix);
    }

    meshes.forEach((mesh) => {
      mesh.rotateX(0.005);
      mesh.rotateY(0.01);
    });
    renderer.render(scene, camera);
  });
});
