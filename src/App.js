// https://twitter.com/lusionltd/status/1701534187545636964
// https://lusion.co

import * as THREE from 'three'
import { useRef, useReducer, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, MeshTransmissionMaterial, Environment, Lightformer } from '@react-three/drei'
import { CuboidCollider, MeshCollider, BallCollider, Physics, RigidBody } from '@react-three/rapier'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import { easing } from 'maath'
import { Rainbow } from './Rainbow'
import { Beam } from './Beam'

const accents = ['#0084D6', '#3DB5FF', '#20ffa0', '#ffcc00']
const shuffle = (accent = 0) => [
  { color: '#444', roughness: 0.5 },
  { color: '#444', roughness: 0.75 },
  // { color: '#444', roughness: 0.75 },
  // { color: 'white', roughness: 0.1 },
  { color: 'white', roughness: 0.75 },
  { color: 'white', roughness: 0.5 },
  { color: accents[accent], roughness: 0.5, accent: true },
  { color: accents[accent], roughness: 0.75, accent: true },
  { color: accents[accent], roughness: 0.5, accent: true }
]

export const App = () => (
  <div className="container">
    <Scene style={{ borderRadius: 20, height: '90vh' }} />
  </div>
)

function Scene(props) {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0)
  const connectors = useMemo(() => shuffle(accent), [accent])

  return (
    <Canvas onClick={click} shadows dpr={[1, 1.5]} gl={{ antialias: false }} camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }} {...props}>
      <color attach="background" args={['#002136']} />
      <ambientLight intensity={0.1} />
      {/* <RotatingRainbow /> */}
      {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} castShadow /> */}
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {connectors.map((props, i) => <Connector key={i} {...props} />) /* prettier-ignore  */}
        <BeamBox>
          <Connector position={[0, 0, 0]} christal={accents[0]} color="white">
            <Model>
              <MeshTransmissionMaterial clearcoat={1} thickness={4} anisotropicBlur={0.4} chromaticAberration={0.8} samples={16} resolution={2048} />
            </Model>
          </Connector>
        </BeamBox>
      </Physics>
      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>
    </Canvas>
  )
}

function BeamBox({ children }) {
  const boxreflect = useRef(null)
  useFrame((state) => {
    // Tie beam to the mouse.
    boxreflect.current.setRay([(state.pointer.x * state.viewport.width) / 2, (state.pointer.y * state.viewport.height) / 2, 0], [0, 0, 0])
  })
  return (
    <Beam ref={boxreflect} bounce={10} far={20}>
      {children}
    </Beam>
  )
}

function RotatingRainbow() {
  const rainbowRef = useRef()
  useFrame((state, delta) => (rainbowRef.current.rotation.z += delta / 5))

  return <Rainbow ref={rainbowRef} startRadius={0} endRadius={0.65} fade={0.5} />
}

function Connector({ position, children, vec = new THREE.Vector3(), scale, r = THREE.MathUtils.randFloatSpread, accent, christal, ...props }) {
  const api = useRef()
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [])
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta)
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.2))
  })
  return (
    <RigidBody linearDamping={4} angularDamping={1} friction={0.1} position={pos} ref={api} colliders={false}>
      {/* <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} /> */}
      <MeshCollider type="hull">
        {children ? children : <Model scale={0.05} {...props} />}
        {true && <pointLight intensity={10} distance={2.5} color={props.color} />}
      </MeshCollider>
    </RigidBody>
  )
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef()
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(vec.set((mouse.x * viewport.width) / 2, (mouse.y * viewport.height) / 2, 0))
  })
  return (
    <RigidBody position={[0, 0, 0]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  )
}

function Model({ children, color = 'white', roughness = 0, scale = 0.08, ...props }) {
  const ref = useRef()
  //const { nodes, materials } = useGLTF('/c-transformed.glb')

  const { nodes: n } = useGLTF('/cavorit-chrystal-3.glb')
  useFrame((state, delta) => {
    easing.dampC(ref.current.material.color, color, 0.2, delta)
  })
  return (
    <mesh ref={ref} castShadow receiveShadow scale={scale} geometry={n.connector.geometry}>
      <meshStandardMaterial metalness={0.1} roughness={roughness} />
      {children}
    </mesh>
  )
}
