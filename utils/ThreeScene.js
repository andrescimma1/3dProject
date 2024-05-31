// components/ThreeScene.js
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MD2CharacterComplex } from "three/examples/jsm/misc/MD2CharacterComplex.js";
import { Gyroscope } from "three/examples/jsm/misc/Gyroscope.js";

const ThreeScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let SCREEN_WIDTH = window.innerWidth;
    let SCREEN_HEIGHT = window.innerHeight;

    let container, stats;
    let camera, scene, renderer;
    const characters = [];
    let nCharacters = 0;
    let cameraControls;

    const controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
    };

    const clock = new THREE.Clock();

    function init() {
      container = mountRef.current;

      // CAMERA
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        4000
      );
      camera.position.set(0, 150, 1300);

      // SCENE
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      scene.fog = new THREE.Fog(0xffffff, 1000, 4000);
      scene.add(camera);

      // LIGHTS
      scene.add(new THREE.AmbientLight(0x666666, 3));
      const light = new THREE.DirectionalLight(0xffffff, 7);
      light.position.set(200, 450, 500);
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 100;
      light.shadow.camera.far = 1200;
      light.shadow.camera.left = -1000;
      light.shadow.camera.right = 1000;
      light.shadow.camera.top = 350;
      light.shadow.camera.bottom = -350;
      scene.add(light);

      // GROUND
      const gt = new THREE.TextureLoader().load(
        "/textures/terrain/grasslight-big.jpg"
      );
      const gg = new THREE.PlaneGeometry(16000, 16000);
      const gm = new THREE.MeshPhongMaterial({ color: 0xffffff, map: gt });
      const ground = new THREE.Mesh(gg, gm);
      ground.rotation.x = -Math.PI / 2;
      ground.material.map.repeat.set(64, 64);
      ground.material.map.wrapS = THREE.RepeatWrapping;
      ground.material.map.wrapT = THREE.RepeatWrapping;
      ground.material.map.colorSpace = THREE.SRGBColorSpace;
      ground.receiveShadow = true;
      scene.add(ground);

      // RENDERER
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      container.appendChild(renderer.domElement);

      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // STATS
      stats = new Stats();
      container.appendChild(stats.dom);

      // EVENTS
      window.addEventListener("resize", onWindowResize);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

      // CONTROLS
      cameraControls = new OrbitControls(camera, renderer.domElement);
      cameraControls.target.set(0, 50, 0);
      cameraControls.update();

      // CHARACTER
      const configOgro = {
        baseUrl: "/models/md2/ogro/",
        body: "ogro.md2",
        skins: ["ctf_b.png"],
        weapons: [["weapon.md2", "weapon.jpg"]],
        animations: {
          move: "run",
          idle: "stand",
          jump: "jump",
          attack: "attack",
          crouchMove: "cwalk",
          crouchIdle: "cstand",
          crouchAttach: "crattack",
        },
        walkSpeed: 350,
        crouchSpeed: 175,
      };

      const nRows = 1;
      const nSkins = configOgro.skins.length;
      nCharacters = nSkins * nRows;

      for (let i = 0; i < nCharacters; i++) {
        const character = new MD2CharacterComplex();
        character.scale = 3;
        character.controls = controls;
        characters.push(character);
      }

      const baseCharacter = new MD2CharacterComplex();
      baseCharacter.scale = 3;

      baseCharacter.onLoadComplete = function () {
        let k = 0;
        for (let j = 0; j < nRows; j++) {
          for (let i = 0; i < nSkins; i++) {
            const cloneCharacter = characters[k];
            cloneCharacter.shareParts(baseCharacter);
            cloneCharacter.enableShadows(true);
            cloneCharacter.setWeapon(0);
            cloneCharacter.setSkin(i);
            cloneCharacter.root.position.x = (i - nSkins / 2) * 150;
            cloneCharacter.root.position.z = j * 250;
            scene.add(cloneCharacter.root);
            k++;
          }
        }

        const gyro = new Gyroscope();
        gyro.add(camera);
        gyro.add(light, light.target);
        characters[Math.floor(nSkins / 2)].root.add(gyro);
      };

      baseCharacter.loadParts(configOgro);
    }

    function onWindowResize() {
      SCREEN_WIDTH = window.innerWidth;
      SCREEN_HEIGHT = window.innerHeight;
      renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      camera.updateProjectionMatrix();
    }

    function onKeyDown(event) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          controls.moveForward = true;
          break;
        case "ArrowDown":
        case "KeyS":
          controls.moveBackward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          controls.moveLeft = true;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.moveRight = true;
          break;
      }
    }

    function onKeyUp(event) {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          controls.moveForward = false;
          break;
        case "ArrowDown":
        case "KeyS":
          controls.moveBackward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          controls.moveLeft = false;
          break;
        case "ArrowRight":
        case "KeyD":
          controls.moveRight = false;
          break;
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      render();
      stats.update();
    }

    function render() {
      const delta = clock.getDelta();
      for (let i = 0; i < nCharacters; i++) {
        characters[i].update(delta);
      }
      renderer.render(scene, camera);
    }

    init();
    animate();

    return () => {
      container.removeChild(renderer.domElement);
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default ThreeScene;
