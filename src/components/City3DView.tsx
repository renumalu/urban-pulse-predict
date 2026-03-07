import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';

function Building({ position, height, congestion }: { position: [number, number, number]; height: number; congestion: number }) {
  const color = new THREE.Color().setHSL(0.55 - congestion * 0.55, 0.8, 0.3 + congestion * 0.3);
  return (
    <mesh position={[position[0], height / 2, position[2]]} castShadow>
      <boxGeometry args={[0.6, height, 0.6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.85} />
    </mesh>
  );
}

function CityGrid({ traffic }: { traffic: TrafficData[] }) {
  const buildings = useMemo(() => {
    const b: { pos: [number, number, number]; h: number; zone: number }[] = [];
    for (let x = -5; x <= 5; x += 1.2) {
      for (let z = -5; z <= 5; z += 1.2) {
        if (Math.abs(x) < 0.4 || Math.abs(z) < 0.4) continue; // roads
        if (Math.abs(x - 2.4) < 0.4 || Math.abs(x + 2.4) < 0.4) continue;
        if (Math.abs(z - 2.4) < 0.4 || Math.abs(z + 2.4) < 0.4) continue;
        const h = 0.5 + Math.random() * 2.5;
        const zone = Math.floor((x + 5) / 2.5) + Math.floor((z + 5) / 2.5) * 4;
        b.push({ pos: [x, 0, z], h, zone: zone % 12 });
      }
    }
    return b;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => {
        const cong = traffic[b.zone]?.congestionLevel ?? 0.2;
        return <Building key={i} position={b.pos} height={b.h} congestion={cong} />;
      })}
    </group>
  );
}

function Roads() {
  const roadColor = new THREE.Color(0x1a2a3a);
  return (
    <group>
      {/* Main roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.8, 12]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[12, 0.8]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.4, 0.01, 0]}>
        <planeGeometry args={[0.6, 12]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4, 0.01, 0]}>
        <planeGeometry args={[0.6, 12]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.4]}>
        <planeGeometry args={[12, 0.6]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2.4]}>
        <planeGeometry args={[12, 0.6]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>
    </group>
  );
}

function TrafficParticles({ traffic }: { traffic: TrafficData[] }) {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const road = Math.floor(Math.random() * 6);
      const t = (Math.random() - 0.5) * 10;
      const roads = [[0, t], [t, 0], [2.4, t], [-2.4, t], [t, 2.4], [t, -2.4]];
      arr[i * 3] = roads[road][0] + (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 1] = 0.1;
      arr[i * 3 + 2] = roads[road][1] + (Math.random() - 0.5) * 0.3;
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = 0.2; arr[i * 3 + 1] = 0.8; arr[i * 3 + 2] = 1.0;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const avgCong = traffic.length ? traffic.reduce((s, t) => s + t.congestionLevel, 0) / traffic.length : 0.3;
    const speed = (1 - avgCong * 0.8) * 2;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += (Math.random() - 0.5) * delta * speed;
      pos[i * 3 + 2] += (Math.random() - 0.5) * delta * speed;
      if (Math.abs(pos[i * 3]) > 6) pos[i * 3] *= -0.5;
      if (Math.abs(pos[i * 3 + 2]) > 6) pos[i * 3 + 2] *= -0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function FloodLayer({ flood }: { flood: FloodData[] }) {
  const avgRisk = flood.length ? flood.reduce((s, f) => s + f.riskLevel, 0) / flood.length : 0;
  const waterHeight = avgRisk * 0.5;
  
  return waterHeight > 0.02 ? (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterHeight, 0]}>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial color="#0066cc" transparent opacity={avgRisk * 0.4} />
    </mesh>
  ) : null;
}

function AccidentMarkers({ accidents }: { accidents: AccidentData[] }) {
  return (
    <group>
      {accidents.slice(0, 8).map((a) => (
        <mesh key={a.id} position={[a.lat, 0.3, a.lng]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color={a.severity === 'high' ? '#ff3333' : a.severity === 'medium' ? '#ff9933' : '#ffcc00'}
            emissive={a.severity === 'high' ? '#ff0000' : '#ff6600'}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[14, 14]} />
      <meshStandardMaterial color="#0a1520" />
    </mesh>
  );
}

interface City3DViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
}

export default function City3DView({ traffic, flood, accidents }: City3DViewProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border glow-blue">
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }} shadows>
        <color attach="background" args={['#060d15']} />
        <fog attach="fog" args={['#060d15', 15, 30]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 10, 5]} intensity={0.4} castShadow />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#0088ff" />
        
        <Ground />
        <Roads />
        <CityGrid traffic={traffic} />
        <TrafficParticles traffic={traffic} />
        <FloodLayer flood={flood} />
        <AccidentMarkers accidents={accidents} />
        
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={20} />
      </Canvas>
    </div>
  );
}
