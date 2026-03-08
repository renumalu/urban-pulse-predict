import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { TrafficData, FloodData, AccidentData } from '@/lib/simulation';
import { INDIAN_ZONES } from '@/lib/india-zones';

// Generate a 6x6 grid for 36 zones
const ZONE_GRID = INDIAN_ZONES.map((z, i) => ({
  id: i,
  name: z.name,
  cx: (i % 6 - 2.5) * 2.2,
  cz: (Math.floor(i / 6) - 2.5) * 2.2,
}));

interface ZoneTooltipData {
  name: string;
  congestion: number;
  vehicles: number;
  avgSpeed: number;
  prediction: number;
  floodRisk: number;
  rainfall: number;
  accidents: number;
  position: [number, number, number];
}

function Building({ position, height, congestion, onClick }: { 
  position: [number, number, number]; height: number; congestion: number; onClick?: (e: any) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = new THREE.Color().setHSL(0.55 - congestion * 0.55, 0.8, 0.3 + congestion * 0.3);
  const hoverColor = new THREE.Color().setHSL(0.55 - congestion * 0.55, 1, 0.5 + congestion * 0.2);

  return (
    <mesh
      ref={ref}
      position={[position[0], height / 2, position[2]]}
      castShadow
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[0.35, height, 0.35]} />
      <meshStandardMaterial
        color={hovered ? hoverColor : color}
        emissive={hovered ? hoverColor : color}
        emissiveIntensity={hovered ? 0.4 : 0.15}
        transparent
        opacity={hovered ? 1 : 0.85}
      />
    </mesh>
  );
}

function ZoneGroup({ zone, traffic, flood, accidents, onZoneClick }: {
  zone: typeof ZONE_GRID[0];
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
  onZoneClick: (data: ZoneTooltipData) => void;
}) {
  const buildings = useMemo(() => {
    const b: { pos: [number, number, number]; h: number }[] = [];
    for (let dx = -0.4; dx <= 0.4; dx += 0.4) {
      for (let dz = -0.4; dz <= 0.4; dz += 0.4) {
        const h = 0.3 + Math.abs(Math.sin(zone.cx * 3 + dx * 7) * Math.cos(zone.cz * 3 + dz * 7)) * 1.8;
        b.push({ pos: [zone.cx + dx, 0, zone.cz + dz], h });
      }
    }
    return b;
  }, [zone]);

  const t = traffic.find(td => td.zoneId === `z${zone.id}`);
  const f = flood.find(fd => fd.zoneId === `z${zone.id}`);
  const zoneAccidents = accidents.filter(a => a.zone === zone.name);
  const cong = t?.congestionLevel ?? 0.2;

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    onZoneClick({
      name: zone.name,
      congestion: t?.congestionLevel ?? 0,
      vehicles: t?.vehicleCount ?? 0,
      avgSpeed: t?.avgSpeed ?? 0,
      prediction: t?.prediction60min ?? 0,
      floodRisk: f?.riskLevel ?? 0,
      rainfall: f?.rainfall ?? 0,
      accidents: zoneAccidents.length,
      position: [zone.cx, 2, zone.cz],
    });
  }, [zone, t, f, zoneAccidents]);

  return (
    <group>
      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} height={b.h} congestion={cong} onClick={handleClick} />
      ))}
    </group>
  );
}

function ZoneTooltip({ data, onClose }: { data: ZoneTooltipData; onClose: () => void }) {
  const congColor = data.congestion > 0.7 ? 'text-neon-red' : data.congestion > 0.4 ? 'text-neon-orange' : 'text-neon-green';
  const floodColor = data.floodRisk > 0.7 ? 'text-neon-cyan' : data.floodRisk > 0.4 ? 'text-neon-blue' : 'text-muted-foreground';

  return (
    <Html position={data.position} center style={{ pointerEvents: 'auto' }}>
      <div
        className="bg-card/95 backdrop-blur-md border border-primary/40 rounded-lg p-3 w-56 shadow-lg"
        style={{ boxShadow: '0 0 20px hsl(200 100% 50% / 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display text-xs tracking-wider text-primary truncate">{data.name}</h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs ml-2">✕</button>
        </div>
        <div className="space-y-1.5 text-xs font-mono-tech">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Congestion</span>
            <span className={congColor}>{Math.round(data.congestion * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${data.congestion * 100}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicles</span>
            <span className="text-foreground">{data.vehicles.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Speed</span>
            <span className="text-foreground">{data.avgSpeed} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">60min Forecast</span>
            <span className={congColor}>{Math.round(data.prediction * 100)}%</span>
          </div>
          <div className="border-t border-border my-1" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flood Risk</span>
            <span className={floodColor}>{Math.round(data.floodRisk * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rainfall</span>
            <span className="text-foreground">{data.rainfall.toFixed(1)} mm/hr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accidents</span>
            <span className={data.accidents > 0 ? 'text-neon-red' : 'text-neon-green'}>{data.accidents}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

function Roads() {
  const roadColor = new THREE.Color(0x1a2a3a);
  const roads: [number, number, number, number][] = [];
  // Horizontal roads
  for (let row = -2.5; row <= 2.5; row += 1) {
    roads.push([0, 0.01, row * 2.2, 0]); // horizontal
  }
  // Vertical roads
  for (let col = -2.5; col <= 2.5; col += 1) {
    roads.push([col * 2.2, 0.01, 0, Math.PI / 2]); // vertical
  }
  return (
    <group>
      {roads.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, r[3] || 0]} position={[r[0], r[1], r[2]]}>
          <planeGeometry args={[0.3, 16]} />
          <meshStandardMaterial color={roadColor} />
        </mesh>
      ))}
    </group>
  );
}

function TrafficParticles({ traffic }: { traffic: TrafficData[] }) {
  const ref = useRef<THREE.Points>(null);
  const count = 300;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = 0.1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14;
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
      if (Math.abs(pos[i * 3]) > 7) pos[i * 3] *= -0.5;
      if (Math.abs(pos[i * 3 + 2]) > 7) pos[i * 3 + 2] *= -0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function FloodLayer({ flood }: { flood: FloodData[] }) {
  const avgRisk = flood.length ? flood.reduce((s, f) => s + f.riskLevel, 0) / flood.length : 0;
  const waterHeight = avgRisk * 0.5;
  return waterHeight > 0.02 ? (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterHeight, 0]}>
      <planeGeometry args={[16, 16]} />
      <meshStandardMaterial color="#0066cc" transparent opacity={avgRisk * 0.4} />
    </mesh>
  ) : null;
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[18, 18]} />
      <meshStandardMaterial color="#0a1520" />
    </mesh>
  );
}

interface City3DViewProps {
  traffic: TrafficData[];
  flood: FloodData[];
  accidents: AccidentData[];
}

function Scene({ traffic, flood, accidents }: City3DViewProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneTooltipData | null>(null);

  return (
    <>
      <Ground />
      <Roads />
      {ZONE_GRID.map(zone => (
        <ZoneGroup
          key={zone.id}
          zone={zone}
          traffic={traffic}
          flood={flood}
          accidents={accidents}
          onZoneClick={setSelectedZone}
        />
      ))}
      <TrafficParticles traffic={traffic} />
      <FloodLayer flood={flood} />
      {selectedZone && (
        <ZoneTooltip data={selectedZone} onClose={() => setSelectedZone(null)} />
      )}
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={4} maxDistance={25} />
    </>
  );
}

export default function City3DView({ traffic, flood, accidents }: City3DViewProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border glow-blue">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }} shadows>
        <color attach="background" args={['#060d15']} />
        <fog attach="fog" args={['#060d15', 18, 35]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 10, 5]} intensity={0.4} castShadow />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#0088ff" />
        <Scene traffic={traffic} flood={flood} accidents={accidents} />
      </Canvas>
    </div>
  );
}
