import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Stadium = () => {
  return (
    <group>
      {/* Stadium floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>

      {/* Field lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#4a8c2a" />
      </mesh>

      {/* Stadium lights */}
      <pointLight position={[10, 15, 10]} intensity={1} />
      <pointLight position={[-10, 15, 10]} intensity={1} />
      <pointLight position={[10, 15, -10]} intensity={1} />
      <pointLight position={[-10, 15, -10]} intensity={1} />

      {/* Crowd stands (simplified) */}
      <mesh position={[0, 2, -15]}>
        <boxGeometry args={[40, 8, 2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      <mesh position={[0, 2, 15]}>
        <boxGeometry args={[40, 8, 2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[-20, 2, 0]}>
        <boxGeometry args={[2, 8, 30]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[20, 2, 0]}>
        <boxGeometry args={[2, 8, 30]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Center display screen */}
      <mesh position={[0, 8, 0]}>
        <boxGeometry args={[8, 4, 0.5]} />
        <meshStandardMaterial color="#000000" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const ARVRViewer = ({ eventId }) => {
  return (
    <div className="arvr-viewer">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 20]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 10, 5]} intensity={1} />
        
        <Stadium />
        
        <Environment preset="sunset" />
      </Canvas>
      
      <div className="arvr-overlay">
        <div className="arvr-info">
          <p>🥽 VR Mode Active</p>
          <p>Use mouse to navigate the 3D environment</p>
        </div>
      </div>
    </div>
  );
};

export default ARVRViewer;
