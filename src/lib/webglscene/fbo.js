import * as THREE from 'three';
import quad2Vert from './shaders/quad2.vert';
import throughFrag from './shaders/through.frag';
import particlesVert from './shaders/particles.vert';
import particlesFrag from './shaders/particles.frag';
import particlesDistanceVert from './shaders/particlesDistance.vert';
import particlesDistanceFrag from './shaders/particlesDistance.frag';
import positionFrag from './shaders/position.frag';


export default class FBO {
  init(renderer, mainScene) {

    this.parameters = {
      speed: 0.1,
      morph: 1.0,
      motion: 0.0
    };

    this.renderer = renderer;
    this.width = 300;
    this.height = 300;
    this.initAnimation = 0;
    this.amount = this.width * this.height;
    this.mainScene = mainScene;

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    const rawShaderPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n';

    this.copyShader = new THREE.RawShaderMaterial({
      uniforms: {
          resolution: { type: 'v2', value: new THREE.Vector2( this.width, this.height ) },
          texture: { type: 't', value: null }
      },
      vertexShader: rawShaderPrefix + quad2Vert,
      fragmentShader: rawShaderPrefix + throughFrag
    });

    this.positionShader = new THREE.RawShaderMaterial({
      uniforms: {
          resolution: { type: 'v2', value: new THREE.Vector2( this.width, this.height ) },
          texturePosition: { type: 't', value: null },
          textureMorphPositionA: { type: 't', value: null },
          textureMorphPositionB: { type: 't', value: null },
          morph: { type: 'f', value: this.parameters.morph },
          motion: { type: 'f', value: this.parameters.motion },
          mouse3d: { type: 'v3', value: new THREE.Vector3 },
          speed: { type: 'f', value: this.parameters.speed },
          dieSpeed: { type: 'f', value: 0 },
          radius: { type: 'f', value: 0 },
          curlSize: { type: 'f', value: 0.005 },
          attraction: { type: 'f', value: 0 },
          time: { type: 'f', value: 0 },
          initAnimation: { type: 'f', value: 0 }
      },
      vertexShader: rawShaderPrefix + quad2Vert,
      fragmentShader: rawShaderPrefix + positionFrag,
      blending: THREE.NoBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false
    });

    this.mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.copyShader );
    this.scene.add( this.mesh );

    this.positionRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
    });

    this.textureMorphPositionA = this.createPositionTextureCube();
    this.textureMorphPositionB = this.createPositionTextureDoubleSphere();

    this.positionRenderTarget2 = this.positionRenderTarget.clone();
    this.copyTexture(this.textureMorphPositionA, this.positionRenderTarget);
    this.copyTexture(this.positionRenderTarget.texture, this.positionRenderTarget2);

    this.createParticles()
  }

  copyTexture(inputTexture, outputRenderTarget) {
    this.mesh.material = this.copyShader;
    this.copyShader.uniforms.texture.value = inputTexture;
    this.renderer.setRenderTarget(outputRenderTarget)
    this.renderer.render( this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }

  createPositionTexture() {
    var positions = new Float32Array( this.amount * 4 );
    var i4;
    var r, phi, theta;
    for(var i = 0; i < this.amount; i++) {
        i4 = i * 4;
        r = (0.5 + Math.random() * 0.5) * 50;
        phi = (Math.random() - 0.5) * Math.PI;
        theta = Math.random() * Math.PI * 2;
        positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
        positions[i4 + 1] = r * Math.sin(phi);
        positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
        positions[i4 + 3] = Math.random();
    }
    
    var texture = new THREE.DataTexture( positions, this.width, this.height, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
  }

  createPositionTextureCube() {

    const size = 200;
    let len = this.amount * 4;

    var positions = new Float32Array( len );
    while( len-- ) positions[len] = ( Math.random() -.5 ) * size ;

    var texture = new THREE.DataTexture( positions, this.width, this.height, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
  }

  createPositionTextureSphere() {

    const radius = 50;

    function getPoint(v,size)
    {
        v.x = Math.random() * 2 - 1 ;
        v.y = Math.random() * 2 - 1 ;
        v.z = Math.random() * 2 - 1 ;
        if(v.length()>1)return getPoint(v,size);
        return v.normalize().multiplyScalar(size);
    }
    var len = this.amount * 4;
    var positions = new Float32Array( len );
    var p = new THREE.Vector3();
    for( var i = 0; i < len; i+=4 )
    {
        getPoint( p, radius );
        positions[ i     ] = p.x;
        positions[ i + 1 ] = p.y;
        positions[ i + 2 ] = p.z;
        positions[ i + 3 ] = Math.random();
    }

    var texture = new THREE.DataTexture( positions, this.width, this.height, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
  }

  createPositionTextureDoubleSphere() {

    const radius = 50;
    const radius2 = 20;

    function getPoint(v,size)
    {
        v.x = Math.random() * 2 - 1 ;
        v.y = Math.random() * 2 - 1 ;
        v.z = Math.random() * 2 - 1 ;
        if(v.length()>1)return getPoint(v,size);
        return v.normalize().multiplyScalar(size);
    }
    var len = this.amount * 4;
    var positions = new Float32Array( len );
    var p = new THREE.Vector3();
    for( var i = 0; i < len/2; i+=4 )
    {
        getPoint( p, radius );
        positions[ i     ] = p.x;
        positions[ i + 1 ] = p.y;
        positions[ i + 2 ] = p.z;
        positions[ i + 3 ] = Math.random();
    }

    for( var i = len/2; i < len; i+=4 )
    {
        getPoint( p, radius2 );
        positions[ i     ] = p.x;
        positions[ i + 1 ] = p.y;
        positions[ i + 2 ] = p.z;
        positions[ i + 3 ] = Math.random();
    }

    var texture = new THREE.DataTexture( positions, this.width, this.height, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    return texture;
  }
 

  createParticles() {

    var position = new Float32Array(this.amount * 3);
    var i3;
    for(var i = 0; i < this.amount; i++ ) {
        i3 = i * 3;
        position[i3 + 0] = (i % this.width) / this.height;
        position[i3 + 1] = ~~(i / this.width) / this.height;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( position, 3 ));

    var material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge( [
				THREE.UniformsLib.lights,
				{
          texturePosition: { type: 't', value: this.positionRenderTarget.texture },
          color: { type: 'c', value: new THREE.Color(1.0, 1.0, 1.0) },
          opacity: { type: 'f', value: 0.8 },
        }
      ]),
      defines: {
				USE_SHADOW: true
			},
      lights: true,
      vertexShader: particlesVert,
      fragmentShader: particlesFrag,
      blending: THREE.AdditiveBlending
    });

    this.particleMesh = new THREE.Points( geometry, material );

    this.particleMesh.customDistanceMaterial = new THREE.ShaderMaterial( {
      uniforms: {
          texturePosition: { type: 't', value: this.positionRenderTarget.texture },
          referencePosition: {type: 'v3',  value: new THREE.Vector3(0,0,30) },
          nearDistance: {type: 'f', value: 1 },
          farDistance: {type: 'f', value: 1000 }
      },
      vertexShader: particlesDistanceVert,
      fragmentShader: particlesDistanceFrag,
      depthTest: false,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NoBlending
    });

    this.particleMesh.castShadow = true;
    this.particleMesh.receiveShadow = true;
    this.mainScene.add(this.particleMesh);
  }

  update(dt) {
    // swap
    const tmp = this.positionRenderTarget;
    this.positionRenderTarget = this.positionRenderTarget2;
    this.positionRenderTarget2 = tmp;

    this.initAnimation = Math.min(this.initAnimation + dt * 0.00025, 1);

    this.mesh.material = this.positionShader;
    this.positionShader.uniforms.textureMorphPositionA.value = this.textureMorphPositionA;
    this.positionShader.uniforms.textureMorphPositionB.value = this.textureMorphPositionB;
    this.positionShader.uniforms.texturePosition.value = this.positionRenderTarget2.texture;
    this.positionShader.uniforms.speed.value = this.parameters.speed;
    this.positionShader.uniforms.morph.value = this.parameters.morph;
    this.positionShader.uniforms.motion.value = this.parameters.motion;
    this.positionShader.uniforms.time.value += dt * 0.001;
    this.positionShader.uniforms.initAnimation.value = this.initAnimation;

    this.particleMesh.material.uniforms.texturePosition.value = this.positionRenderTarget.texture;
    this.particleMesh.customDistanceMaterial.uniforms.texturePosition.value = this.positionRenderTarget.texture;

    this.renderer.setRenderTarget(this.positionRenderTarget)
    this.renderer.clear();
    this.renderer.render( this.scene, this.camera);
    this.renderer.setRenderTarget(null)

    // uncomment for testing renderTexture
    //this.renderer.render( this.scene, this.camera);
  }
}