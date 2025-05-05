import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";

/**
 * Props:
 *  - nbUPF: number of UPFs
 *  - nbgNB: number of gNBs
 *  - nbUE: number of UEs
 *  - distances: matrix [gnbIdx][upfIdx] of distance ("" or numeric string)
 *  - links: boolean matrix [upfIdx][upfIdx]
 */
export default function Topology3D({ nbUPF, nbgNB, nbUE, distances, links }) {
  // Compute positions
  const upfPositions = useMemo(() => {
    const spread = 8;
    return Array.from({ length: nbUPF }, (_, i) => [
      (i - (nbUPF - 1) / 2) * spread,
      5,
      0,
    ]);
  }, [nbUPF]);

  const gnbPositions = useMemo(() => {
    const spread = 8;
    return Array.from({ length: nbgNB }, (_, j) => [
      (j - (nbgNB - 1) / 2) * spread,
      0,
      0,
    ]);
  }, [nbgNB]);

  const uePositions = useMemo(() => {
    const spread = 2;
    const perGnb = Math.floor(nbUE / nbgNB);
    const extra = nbUE % nbgNB;
    let ueIndex = 0;
    const positions = [];
    for (let j = 0; j < nbgNB; j++) {
      const count = perGnb + (j < extra ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const x0 = gnbPositions[j][0];
        const offset = (k - (count - 1) / 2) * spread;
        positions.push([x0 + offset, -5, 0]);
        ueIndex++;
      }
    }
    return positions;
  }, [nbUE, nbgNB, gnbPositions]);

  // Build lines: UE->gNB uniform
  const ueGnbLines = useMemo(() => {
    const lines = [];
    let ueIdx = 0;
    const perGnb = Math.floor(nbUE / nbgNB);
    const extra = nbUE % nbgNB;
    for (let j = 0; j < nbgNB; j++) {
      const count = perGnb + (j < extra ? 1 : 0);
      for (let k = 0; k < count; k++) {
        lines.push({
          points: [uePositions[ueIdx], gnbPositions[j]],
        });
        ueIdx++;
      }
    }
    return lines;
  }, [uePositions, gnbPositions, nbUE, nbgNB]);

  // gNB->UPF lines based on distances matrix
  const gnbUpfLines = useMemo(() => {
    const lines = [];
    for (let j = 0; j < nbgNB; j++) {
      for (let i = 0; i < nbUPF; i++) {
        const d = distances[j]?.[i];
        if (d !== "" && !isNaN(Number(d))) {
          lines.push({ points: [gnbPositions[j], upfPositions[i]] });
        }
      }
    }
    return lines;
  }, [distances, gnbPositions, upfPositions, nbgNB, nbUPF]);

  // UPF<->UPF links
  const upfUpfLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nbUPF; i++) {
      for (let j = i + 1; j < nbUPF; j++) {
        if (links[i]?.[j]) {
          lines.push({ points: [upfPositions[i], upfPositions[j]] });
        }
      }
    }
    return lines;
  }, [links, upfPositions, nbUPF]);

  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* UPFs */}
      {upfPositions.map((pos, idx) => (
        <mesh key={`upf-${idx}`} position={pos}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshPhongMaterial color="orange" />
        </mesh>
      ))}

      {/* gNBs */}
      {gnbPositions.map((pos, idx) => (
        <mesh key={`gnb-${idx}`} position={pos}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshPhongMaterial color="cyan" />
        </mesh>
      ))}

      {/* UEs */}
      {uePositions.map((pos, idx) => (
        <mesh key={`ue-${idx}`} position={pos}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshPhongMaterial color="lightgreen" />
        </mesh>
      ))}

      {/* Lines */}
      {ueGnbLines.map((l, idx) => (
        <Line key={`ue-gnb-line-${idx}`} points={l.points} lineWidth={1} />
      ))}
      {gnbUpfLines.map((l, idx) => (
        <Line
          key={`gnb-upf-line-${idx}`}
          points={l.points}
          lineWidth={1}
          dashed
        />
      ))}
      {upfUpfLines.map((l, idx) => (
        <Line
          key={`upf-upf-line-${idx}`}
          points={l.points}
          lineWidth={1}
          dashed
        />
      ))}

      <OrbitControls />
    </Canvas>
  );
}
