import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

class SchoolMap {
  constructor() {
    this.container = document.querySelector('#app')
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xeeeeee)
    
    this.initCamera()
    this.initRenderer()
    this.initLights()
    this.initControls()
    this.addPlaceholder()
    
    // Resize handler
    window.addEventListener('resize', () => this.onWindowResize())
    
    this.animate()
    
    console.log('School 3D Map Initialized')
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(5, 5, 5)
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    this.scene.add(directionalLight)
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  addPlaceholder() {
    // 학교 모델이 오기 전까지 보여줄 임시 박스
    const geometry = new THREE.BoxGeometry(2, 1, 3)
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    this.scene.add(cube)

    // 바닥 격자
    const gridHelper = new THREE.GridHelper(10, 10)
    this.scene.add(gridHelper)
  }

  loadModel(path) {
    const loader = new GLTFLoader()
    loader.load(
      path,
      (gltf) => {
        this.scene.add(gltf.scene)
        console.log('Model loaded:', path)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
      },
      (error) => {
        console.error('Error loading model:', error)
      }
    )
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

new SchoolMap()
