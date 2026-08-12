import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function RotatingUniverse() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Rotação bem lenta e suave do universo inteiro
      groupRef.current.rotation.y -= delta * 0.02;
      groupRef.current.rotation.x -= delta * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={7000} factor={4} saturation={0.5} fade speed={2} />
    </group>
  );
}

function RealisticMeteor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Estado para controlar se o meteoro está ativo e suas coordenadas
  const state = useRef({
    active: false,
    timer: 0,
    speed: 80, // Velocidade alta
    direction: new THREE.Vector3(),
    position: new THREE.Vector3(),
  });

  useFrame((_, delta) => {
    if (!meshRef.current || !glowRef.current) return;

    if (!state.current.active) {
      state.current.timer -= delta;
      if (state.current.timer <= 0) {
        // Iniciar um novo meteoro
        state.current.active = true;
        
        // Posição inicial aleatória (fora da tela, geralmente em cima/direita)
        const startX = 40 + Math.random() * 40;
        const startY = 20 + Math.random() * 30;
        const startZ = -20 - Math.random() * 20;
        
        // Destino aleatório (baixo/esquerda)
        const endX = -40 - Math.random() * 40;
        const endY = -20 - Math.random() * 30;
        
        state.current.position.set(startX, startY, startZ);
        
        const target = new THREE.Vector3(endX, endY, startZ - 10);
        state.current.direction.subVectors(target, state.current.position).normalize();
        
        // Orientar os meshes na direção do movimento
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          state.current.direction
        );
        meshRef.current.quaternion.copy(quaternion);
        glowRef.current.quaternion.copy(quaternion);
      }
      
      // Esconder enquanto inativo
      meshRef.current.visible = false;
      glowRef.current.visible = false;
      return;
    }

    // Movimentar o meteoro
    meshRef.current.visible = true;
    glowRef.current.visible = true;
    
    const move = state.current.direction.clone().multiplyScalar(state.current.speed * delta);
    state.current.position.add(move);
    
    meshRef.current.position.copy(state.current.position);
    glowRef.current.position.copy(state.current.position);
    
    // Se sair muito da tela, desativar e setar timer
    if (state.current.position.x < -80 || state.current.position.y < -50) {
      state.current.active = false;
      state.current.timer = 1.5 + Math.random() * 4; // Espera de 1.5s a 5.5s para o próximo
    }
  });

  // O meteoro é um rastro de luz: uma esfera muito achatada (escala em Z muito maior)
  return (
    <group>
      <mesh ref={meshRef} scale={[1, 1, 30]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      
      {/* Brilho externo (glow) */}
      <mesh ref={glowRef} scale={[1, 1, 35]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export function StarfieldBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#050505] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <RotatingUniverse />
        <RealisticMeteor />
        {/* Adiciona um segundo meteoro para mais dinamismo */}
        <RealisticMeteor /> 
      </Canvas>
    </div>
  );
}
