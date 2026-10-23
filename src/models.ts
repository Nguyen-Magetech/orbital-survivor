/** Procedural Three.js models; gameplay refers to these through ModelId only. */
import * as THREE from 'three';
import { COLORS } from '@/config/gameplayConstants';
import type { ModelCatalog, ModelSpec } from '@/framework/render/ThreeRenderer';

export type ModelId = 'arena' | 'player' | 'enemy' | 'boss' | 'bolt';

const arena: ModelSpec = {
  defaultColor: COLORS.arena,
  build(color: number): THREE.Object3D {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color });
    for (const radius of [2.1, 3.45]) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      }
      group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
    }
    const spokes = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.45, 0, 0), new THREE.Vector3(3.45, 0, 0),
      new THREE.Vector3(0, -3.45, 0), new THREE.Vector3(0, 3.45, 0),
    ]);
    group.add(new THREE.LineSegments(spokes, material));
    return group;
  },
};

const player: ModelSpec = {
  defaultColor: COLORS.player,
  build(color: number): THREE.Object3D {
    const geometry = new THREE.ConeGeometry(0.32, 0.76, 4);
    const edges = new THREE.EdgesGeometry(geometry);
    geometry.dispose();
    return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
  },
};

const enemy: ModelSpec = {
  defaultColor: COLORS.enemy,
  build(color: number): THREE.Object3D {
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    const edges = new THREE.EdgesGeometry(geometry);
    geometry.dispose();
    return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
  },
};

const bolt: ModelSpec = {
  defaultColor: COLORS.bolt,
  build(color: number): THREE.Object3D {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color }),
    );
  },
};

const boss: ModelSpec = {
  defaultColor: COLORS.boss,
  build(color: number): THREE.Object3D {
    const geometry = new THREE.IcosahedronGeometry(0.42, 1);
    const edges = new THREE.EdgesGeometry(geometry);
    geometry.dispose();
    return new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
  },
};

export const MODELS: ModelCatalog<ModelId> = { arena, player, enemy, boss, bolt };
