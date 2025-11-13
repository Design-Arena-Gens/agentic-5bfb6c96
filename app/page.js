"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SCENE_DURATION = 20;

function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i += 1) {
    const radius = THREE.MathUtils.randFloat(20, 80);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(0, Math.PI);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0x9bbdff,
    size: 0.25,
    sizeAttenuation: true,
    depthWrite: false,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(starGeometry, starMaterial);
}

function createShip(color) {
  const ship = new THREE.Group();

  const hullMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0.2,
    emissive: new THREE.Color(color).multiplyScalar(0.25),
    emissiveIntensity: 0.6,
  });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 2.5, 16), hullMaterial);
  fuselage.rotation.z = Math.PI / 2;
  ship.add(fuselage);

  const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0x112244,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), cockpitMaterial);
  cockpit.position.set(0.6, 0.15, 0);
  ship.add(cockpit);

  const wingGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.4);
  const leftWing = new THREE.Mesh(wingGeometry, hullMaterial);
  leftWing.position.set(0, 0, 0.6);
  const rightWing = leftWing.clone();
  rightWing.position.z = -0.6;
  ship.add(leftWing);
  ship.add(rightWing);

  const finGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.4);
  const upperFin = new THREE.Mesh(finGeometry, hullMaterial);
  upperFin.position.set(-0.8, 0.8, 0);
  ship.add(upperFin);

  const engineGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const engineGlow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16, 1, true), engineGlowMaterial);
  engineGlow.rotation.z = Math.PI;
  engineGlow.position.set(-1.4, 0, 0);
  ship.add(engineGlow);

  const engineLight = new THREE.PointLight(0x66ccff, 2, 6, 2);
  engineLight.position.set(-1.6, 0, 0);
  ship.add(engineLight);

  return ship;
}

function alignToCurve(object, curve, t) {
  const currentPoint = curve.getPointAt(t);
  const lookAtPoint = curve.getPointAt(Math.min(t + 0.001, 1));
  object.position.copy(currentPoint);
  object.lookAt(lookAtPoint);
}

function createNebula() {
  const geometry = new THREE.SphereGeometry(40, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x1b1e4b,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  });
  const nebula = new THREE.Mesh(geometry, material);
  nebula.scale.setScalar(1.8);
  return nebula;
}

function SciFiScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040713, 0.025);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    );
    camera.position.set(-6, 3, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x334466, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x88aaff, 2.2);
    keyLight.position.set(6, 4, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2244aa, 1.5);
    rimLight.position.set(-4, -2, -6);
    scene.add(rimLight);

    const starfield = createStarfield();
    scene.add(starfield);

    const nebula = createNebula();
    scene.add(nebula);

    const targetShip = createShip(0xff5533);
    const chaserShip = createShip(0x44b7ff);
    scene.add(targetShip);
    scene.add(chaserShip);

    const targetCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-8, -1.5, -6),
        new THREE.Vector3(-4, 0.5, -1),
        new THREE.Vector3(-2, 1.3, 1.2),
        new THREE.Vector3(1.5, 1.8, 0.6),
        new THREE.Vector3(4.5, 0.4, -0.8),
        new THREE.Vector3(8, -1.5, -3),
      ],
      false,
      "catmullrom",
      0.4,
    );

    const chaserCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-10, -1.6, -7),
        new THREE.Vector3(-5.5, -0.5, -2),
        new THREE.Vector3(-1.5, 1.1, 1.4),
        new THREE.Vector3(2.2, 1.6, 1.1),
        new THREE.Vector3(5, 0.6, -0.2),
        new THREE.Vector3(8.5, -1.8, -2.4),
      ],
      false,
      "catmullrom",
      0.35,
    );

    const cameraCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-12, 3, 6),
        new THREE.Vector3(-6, 4.6, 4),
        new THREE.Vector3(-1.5, 3.8, 3),
        new THREE.Vector3(2.2, 3.0, 2.4),
        new THREE.Vector3(6.5, 2.2, 1),
        new THREE.Vector3(9.5, 1.4, -1.5),
      ],
      false,
      "catmullrom",
      0.5,
    );

    const clock = new THREE.Clock();
    let animationFrameId;

    function animate() {
      const elapsed = clock.getElapsedTime();
      const rawProgress = elapsed / SCENE_DURATION;
      const clampedProgress = Math.min(rawProgress, 1);

      alignToCurve(targetShip, targetCurve, clampedProgress);
      alignToCurve(chaserShip, chaserCurve, Math.min(clampedProgress * 1.05, 1));

      const cameraPosition = cameraCurve.getPointAt(clampedProgress);
      const cameraLook = targetCurve.getPointAt(Math.min(clampedProgress * 1.02, 1));
      camera.position.copy(cameraPosition);

      const chaseMidpoint = new THREE.Vector3()
        .addVectors(targetShip.position, chaserShip.position)
        .multiplyScalar(0.5);
      const focalPoint = chaseMidpoint.clone().lerp(cameraLook, 0.65);
      camera.lookAt(focalPoint);

      targetShip.rotation.z += Math.sin(elapsed * 2.1) * 0.001;
      chaserShip.rotation.z += Math.cos(elapsed * 2.3) * 0.0012;

      const enginePulse = Math.sin(elapsed * 12) * 0.35 + 0.65;
      targetShip.children.forEach((child) => {
        if (child instanceof THREE.PointLight) {
          child.intensity = 1.5 + enginePulse;
        }
      });
      chaserShip.children.forEach((child) => {
        if (child instanceof THREE.PointLight) {
          child.intensity = 1.8 + enginePulse * 1.2;
        }
      });

      nebula.rotation.y += 0.0006;
      starfield.rotation.y += 0.0004;
      starfield.rotation.x += 0.0002;

      renderer.render(scene, camera);

      if (rawProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animate();

    const handleResize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
          color: "#8fa9f7",
          textTransform: "uppercase",
          letterSpacing: "0.3rem",
          fontSize: "0.75rem",
          fontWeight: 500,
          mixBlendMode: "screen",
        }}
      >
        <span>Deep Sector Pursuit</span>
        <span style={{ alignSelf: "flex-end" }}>Duration: 20s</span>
      </div>
    </div>
  );
}

export default function Home() {
  return <SciFiScene />;
}
