import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

class SchoolMap {
  constructor() {
    this.container = document.querySelector('#app')
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f2f5)
    
    this.floors = {}
    this.pins = {}
    this.currentFloor = 'all'
    this.isCollectionMode = false
    this.isAutoMoving = false
    
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // 층별 설정 및 고유 카메라 타겟 좌표 (사용자 요청 반영)
    this.floorConfigs = {
      '2': { file: 'A-2WithFBX.fbx', offset: 0, camPos: {x: 350, y: 250, z: 350}, lookAt: {x: 0, y: 0, z: 0} },
      '3': { file: 'A-2WithFBX copy.fbx', offset: 65, camPos: {x: 350, y: 315, z: 350}, lookAt: {x: 0, y: 65, z: 0} },
      '4': { file: 'A-2WithFBX copy 2.fbx', offset: 130, camPos: {x: 350, y: 380, z: 350}, lookAt: {x: 0, y: 130, z: 0} }
    }

    this.targetCameraPos = new THREE.Vector3(800, 600, 800)
    this.targetLookAt = new THREE.Vector3(0, 65, 0) // 전체보기 시 중앙

    this.baseRoomCoords = [
      { id: "01", pos: { x: -224.99, y: 1.00, z: 82.75 } },
      { id: "02", pos: { x: -192.26, y: 1.00, z: 81.78 } },
      { id: "03", pos: { x: -144.91, y: 1.00, z: 82.01 } },
      { id: "04", pos: { x: -93.67, y: 1.00, z: 83.09 } },
      { id: "05", pos: { x: -47.99, y: 1.00, z: 79.94 } },
      { id: "06", pos: { x: -25.69, y: 1.00, z: 79.66 } },
      { id: "07", pos: { x: -5.51, y: 1.00, z: 79.19 } },
      { id: "08", pos: { x: 25.19, y: 1.00, z: 77.44 } },
      { id: "09", pos: { x: 59.33, y: 1.00, z: 80.29 } },
      { id: "10", pos: { x: 82.47, y: 1.00, z: 78.97 } },
      { id: "11", pos: { x: 104.97, y: 1.00, z: -10.67 } },
      { id: "12", pos: { x: 136.96, y: 1.00, z: -7.42 } },
      { id: "13", pos: { x: 183.05, y: 1.00, z: -7.07 } },
      { id: "14", pos: { x: 211.78, y: 1.00, z: -4.67 } },
      { id: "15", pos: { x: 234.35, y: 1.00, z: -6.29 } }
    ]

    this.initCamera()
    this.initRenderer()
    this.initLights()
    this.initControls()
    this.loadAllFloors()
    this.initUIEvents()
    
    window.addEventListener('resize', () => this.onWindowResize())
    this.renderer.domElement.addEventListener('mousedown', (e) => this.onSceneClick(e))
    
    this.animate()
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 1, 10000)
    this.camera.position.set(800, 600, 800)
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)
  }

  initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2))
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    sunLight.position.set(100, 1000, 100)
    this.scene.add(sunLight)
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.addEventListener('start', () => { this.isAutoMoving = false })
  }

  loadAllFloors() {
    const loader = new FBXLoader()
    const loadPromises = Object.keys(this.floorConfigs).map(floorNum => {
      return new Promise((resolve) => {
        const config = this.floorConfigs[floorNum]
        loader.load(`/models/${config.file}`, (object) => {
          const floorGroup = new THREE.Group()
          floorGroup.add(object)
          floorGroup.position.y = config.offset
          floorGroup.userData.targetY = config.offset
          floorGroup.userData.floor = floorNum
          
          object.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } })
          this.scene.add(floorGroup)
          this.floors[floorNum] = floorGroup
          
          this.baseRoomCoords.forEach(coord => {
            const roomNum = parseInt(floorNum) * 100 + parseInt(coord.id)
            this.createPin(floorGroup, roomNum.toString(), coord.pos)
          })
          resolve()
        })
      })
    })

    Promise.all(loadPromises).then(() => {
      this.updateRoomList()
      this.controls.target.set(0, 65, 0)
    })
  }

  createPin(group, name, pos) {
    const pinGroup = new THREE.Group()
    const legGeom = new THREE.CylinderGeometry(0.3, 0.3, 30, 8)
    const legMat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
    const leg = new THREE.Mesh(legGeom, legMat)
    leg.position.y = 15
    pinGroup.add(leg)

    const ballGeom = new THREE.SphereGeometry(3.5, 16, 16)
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.4 })
    const ball = new THREE.Mesh(ballGeom, ballMat)
    ball.position.y = 30
    pinGroup.add(ball)
    
    pinGroup.position.set(pos.x, pos.y, pos.z)
    group.add(pinGroup)
    this.pins[name] = pinGroup
  }

  selectFloor(floorNum) {
    this.currentFloor = floorNum
    this.isAutoMoving = true
    
    // 좌표 수집 도구 가시성 제어 (특정 층 선택 시에만 보이게)
    const collector = document.querySelector('.coord-collector')
    collector.style.display = floorNum === 'all' ? 'none' : 'block'

    if (floorNum === 'all') {
      this.targetCameraPos.set(800, 600, 800)
      this.targetLookAt.set(0, 65, 0)
      Object.keys(this.floors).forEach(f => {
        const group = this.floors[f]
        group.visible = true
        group.userData.targetY = this.floorConfigs[f].offset
      })
    } else {
      const config = this.floorConfigs[floorNum]
      this.targetLookAt.set(config.lookAt.x, config.lookAt.y, config.lookAt.z)
      this.targetCameraPos.set(config.camPos.x, config.camPos.y, config.camPos.z)

      Object.keys(this.floors).forEach(f => {
        const group = this.floors[f]
        if (f === floorNum) {
          group.userData.targetY = 0
          group.visible = true
        } else {
          group.userData.targetY = f > floorNum ? 1000 : -1000
        }
      })
    }
    this.updateRoomList()
  }

  updateRoomList() {
    const list = document.querySelector('#room-list')
    list.innerHTML = ''
    const floorNums = this.currentFloor === 'all' ? Object.keys(this.floorConfigs) : [this.currentFloor]
    floorNums.sort((a, b) => b - a).forEach(f => {
      this.baseRoomCoords.forEach(coord => {
        const roomNum = parseInt(f) * 100 + parseInt(coord.id)
        const li = document.createElement('li')
        li.textContent = `A동 ${roomNum}호`
        li.setAttribute('data-room', roomNum)
        li.addEventListener('click', () => {
          this.focusRoom(roomNum.toString())
          document.querySelectorAll('#room-list li').forEach(item => item.classList.remove('active'))
          li.classList.add('active')
        })
        list.appendChild(li)
      })
    })
  }

  initUIEvents() {
    // 초기 상태에서 수집 도구 숨김
    document.querySelector('.coord-collector').style.display = 'none'

    document.querySelectorAll('.floor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this.selectFloor(btn.getAttribute('data-floor'))
      })
    })
    const toggle = document.querySelector('#collect-mode-toggle')
    toggle.addEventListener('change', (e) => this.isCollectionMode = e.target.checked)
    document.querySelector('#clear-logs').addEventListener('click', () => {
      document.querySelector('#coord-logs').innerHTML = ''
    })
  }

  onSceneClick(event) {
    if (!this.isCollectionMode) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const visibleModels = Object.values(this.floors).filter(f => f.visible).map(f => f.children[0])
    const intersects = this.raycaster.intersectObjects(visibleModels, true)
    if (intersects.length > 0) {
      const point = intersects[0].point
      const logContainer = document.querySelector('#coord-logs')
      const entry = document.createElement('div')
      entry.className = 'log-entry'
      entry.textContent = `"pos": { "x": ${point.x.toFixed(2)}, "y": ${point.y.toFixed(2)}, "z": ${point.z.toFixed(2)} }`
      logContainer.prepend(entry)
    }
  }

  focusRoom(roomNum) {
    const pin = this.pins[roomNum]
    if (pin) {
      this.isAutoMoving = true
      Object.values(this.pins).forEach(p => p.children[1].material.color.set(0xff0000))
      pin.children[1].material.color.set(0xffff00)

      const worldPos = new THREE.Vector3()
      pin.children[1].getWorldPosition(worldPos)
      this.targetLookAt.copy(worldPos)
      this.targetCameraPos.set(worldPos.x + 150, worldPos.y + 100, worldPos.z + 150)
      document.querySelector('#room-name').textContent = `A동 ${roomNum}호`
    }
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    Object.values(this.floors).forEach(group => {
      const diff = group.userData.targetY - group.position.y
      if (Math.abs(diff) > 0.1) {
        group.position.y += diff * 0.02
      } else {
        group.position.y = group.userData.targetY
        if (this.currentFloor !== 'all' && group.userData.floor !== this.currentFloor) {
          group.visible = false
        }
      }
    })

    if (this.isAutoMoving) {
      this.camera.position.lerp(this.targetCameraPos, 0.03)
      this.controls.target.lerp(this.targetLookAt, 0.03)
      if (this.camera.position.distanceTo(this.targetCameraPos) < 1) {
        this.isAutoMoving = false
      }
    }

    Object.values(this.pins).forEach(pin => {
      pin.children[1].position.y = 30 + Math.sin(Date.now() * 0.005) * 2
    })

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

new SchoolMap()
