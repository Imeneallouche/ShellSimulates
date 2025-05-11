import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";

/**
 * Props:
 *  - nbDN: number of DNs (Data Networks)
 *  - nbUPF: number of UPFs
 *  - nbgNB: number of gNBs
 *  - nbUE: number of UEs
 *  - dnUpfDistances: matrix [dnIdx][upfIdx] of distance between DNs and UPFs
 *  - distances: matrix [gnbIdx][upfIdx] of distance between gNBs and UPFs
 *  - links: boolean matrix [upfIdx][upfIdx] for UPF connections
 */
export default function Topology3D({ nbDN, nbUPF, nbgNB, nbUE, dnUpfDistances, distances, links }) {
  // Compute positions
  const dnPositions = useMemo(() => {
    const spread = 8;
    return Array.from({ length: nbDN }, (_, i) => [
      (i - (nbDN - 1) / 2) * spread,
      10,
      0,
    ]);
  }, [nbDN]);

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

  // DN->UPF lines based on dnUpfDistances matrix
  const dnUpfLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nbDN; i++) {
      for (let j = 0; j < nbUPF; j++) {
        const d = dnUpfDistances[i]?.[j];
        if (d !== "" && !isNaN(Number(d))) {
          lines.push({ points: [dnPositions[i], upfPositions[j]] });
        }
      }
    }
    return lines;
  }, [dnUpfDistances, dnPositions, upfPositions, nbDN, nbUPF]);

  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* DNs */}
      {dnPositions.map((pos, idx) => (
        <group key={`dn-${idx}`} position={pos}>
          <mesh>
            <boxGeometry args={[2.2, 2.2, 0.2]} />
            <meshStandardMaterial color="#8B5CF6" /> {/* violet-500 */}
          </mesh>
          <Text
            position={[0, 0, 0.21]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            DN
          </Text>
          <Text
            position={[0, 0, -0.21]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            DN
          </Text>
        </group>
      ))}

      {/* UPFs */}
      {upfPositions.map((pos, idx) => (
        <group key={`upf-${idx}`} position={pos}>
          <mesh>
            <boxGeometry args={[2, 2, 0.2]} />
            <meshStandardMaterial color="#F97316" /> {/* orange-500 */}
          </mesh>
          <Text
            position={[0, 0, 0.21]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            UPF
          </Text>
          <Text
            position={[0, 0, -0.21]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            UPF
          </Text>
        </group>
      ))}

      {/* gNBs */}
      {gnbPositions.map((pos, idx) => (
        <group key={`gnb-${idx}`} position={pos}>
          <mesh>
            <boxGeometry args={[2, 2, 0.2]} />
            <meshStandardMaterial color="#6366F1" /> {/* indigo-500 */}
          </mesh>
          <Text
            position={[0, 0, 0.21]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            GNb
          </Text>
          <Text
            position={[0, 0, -0.21]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.6}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            GNb
          </Text>
        </group>
      ))}

      {/* UEs */}
      {uePositions.map((pos, idx) => (
        <group key={`ue-${idx}`} position={pos}>
          <mesh>
            <boxGeometry args={[1.5, 1.5, 0.2]} />
            <meshStandardMaterial color="#10B981" /> {/* emerald-500 */}
          </mesh>
          <Text
            position={[0, 0, 0.21]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            UE
          </Text>
          <Text
            position={[0, 0, -0.21]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            UE
          </Text>
        </group>
      ))}

      {/* Lines */}
      {[...ueGnbLines, ...gnbUpfLines, ...upfUpfLines, ...dnUpfLines].map((l, idx) => (
        <Line
          key={`line-${idx}`}
          points={l.points}
          color="black"
          lineWidth={2} // Thick lines
        />
      ))}

      <OrbitControls />
    </Canvas>
  );
}