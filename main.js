import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// THREE.JS SCENE
// ============================================

class ConstructionScene {
  constructor() {
    this.canvas = document.getElementById('canvas3d');
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.buildings = [];
    this.crane = null;

    this.init();
  }

  init() {
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 5, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minPolarAngle = Math.PI / 4;

    this.addLights();
    this.addGround();
    this.addBuildings();
    this.addCrane();
    this.addParticles();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  addLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(10, 10, 5);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);

    // Accent light (amber)
    const accent = new THREE.PointLight(0xf59e0b, 0.5, 20);
    accent.position.set(-5, 5, -5);
    this.scene.add(accent);

    // Blue fill light
    const fill = new THREE.PointLight(0x3b82f6, 0.3, 20);
    fill.position.set(5, 3, 5);
    this.scene.add(fill);
  }

  addGround() {
    const geometry = new THREE.PlaneGeometry(30, 30);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.2,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    grid.position.y = -0.99;
    this.scene.add(grid);
  }

  addBuildings() {
    const buildingData = [
      { pos: [-3, 0, -3], scale: [1.2, 2.5, 1.2], color: 0x64748b },
      { pos: [0, 0.5, -4], scale: [1.5, 3.5, 1.5], color: 0x475569 },
      { pos: [3, 0, -3], scale: [1, 2, 1], color: 0x94a3b8 },
      { pos: [-4, -0.3, 0], scale: [0.8, 1.5, 0.8], color: 0xcbd5e1 },
      { pos: [4, 0.2, -1], scale: [1.2, 3, 1.2], color: 0x64748b },
      { pos: [-1, -0.2, 2], scale: [0.6, 1, 0.6], color: 0x475569 },
      { pos: [2, 0, 2], scale: [0.8, 1.8, 0.8], color: 0x94a3b8 },
    ];

    buildingData.forEach((data, index) => {
      const geometry = new THREE.BoxGeometry(...data.scale);
      const material = new THREE.MeshStandardMaterial({
        color: data.color,
        metalness: 0.3,
        roughness: 0.4
      });
      const building = new THREE.Mesh(geometry, material);
      building.position.set(...data.pos);
      building.position.y += data.scale[1] / 2 - 1;
      building.castShadow = true;
      building.receiveShadow = true;

      // Store original Y for floating animation
      building.userData.originalY = building.position.y;
      building.userData.floatOffset = index * 0.5;

      this.buildings.push(building);
      this.scene.add(building);
    });
  }

  addCrane() {
    this.crane = new THREE.Group();

    // Tower
    const towerGeo = new THREE.BoxGeometry(0.3, 5, 0.3);
    const craneMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.5,
      roughness: 0.3
    });
    const tower = new THREE.Mesh(towerGeo, craneMat);
    tower.position.y = 2.5;
    tower.castShadow = true;
    this.crane.add(tower);

    // Arm
    const armGeo = new THREE.BoxGeometry(4, 0.2, 0.2);
    const arm = new THREE.Mesh(armGeo, craneMat);
    arm.position.set(1.5, 4.8, 0);
    arm.castShadow = true;
    this.crane.add(arm);

    // Counter weight
    const counterGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const counterMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.6,
      roughness: 0.2
    });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(-0.8, 4.8, 0);
    counter.castShadow = true;
    this.crane.add(counter);

    // Cable
    const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 2);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.8,
      roughness: 0.2
    });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(2.8, 3.8, 0);
    this.crane.add(cable);

    // Hook
    const hookGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const hook = new THREE.Mesh(hookGeo, counterMat);
    hook.position.set(2.8, 2.7, 0);
    hook.castShadow = true;
    this.crane.add(hook);

    this.crane.position.set(0, -1, 1);
    this.scene.add(this.crane);
  }

  addParticles() {
    const particlesCount = 100;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();

    // Animate buildings (floating effect)
    this.buildings.forEach((building) => {
      const offset = building.userData.floatOffset;
      building.position.y = building.userData.originalY + Math.sin(elapsed + offset) * 0.05;
    });

    // Animate crane (rotation)
    if (this.crane) {
      this.crane.rotation.y = Math.sin(elapsed * 0.3) * 0.3;
    }

    // Animate particles
    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.05;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// ============================================
// UI INTERACTIONS
// ============================================

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when clicking a link
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// Project filter
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Update active button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;

    // Filter projects
    projectCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// Contact form

emailjs.init('BeBy9-0ieErVG1LIT');

const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // Honeypot anti-spam
    if (data.company) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      return;
    }

    emailjs.send('service_ejhkn9s', 'template_st2qtrf', {
      name: data.name,
      email: data.email,
      phone: data.phone || 'Not provided',
      project: data.project,
      message: data.message
    })
    .then(() => {
      alert('Thank you for your message! We will get back to you soon.');
      contactForm.reset();
    })
    .catch(() => {
      alert('Oops! Something went wrong. Please try again.');
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    });
  });
}

// Scroll to top
const scrollTopBtn = document.getElementById('scrollTop');
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================
// INIT
// ============================================

// Initialize Three.js scene
new ConstructionScene();

// Simple scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.card, .project-card, .contact-card, .stat, .achievement').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
