import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
console.clear();

const size = 1024;

const canvas = document.getElementById("canvas");
canvas.width = size;
canvas.height = size * 0.5;
const dpr = window.devicePixelRatio / window.devicePixelRatio;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(dpr);
renderer.autoClear = false;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));

const camera = new THREE.PerspectiveCamera(20, 1 / 1, 0.01, 300);
camera.position.set(0, 0, 8);
const look_at = new THREE.Vector3(0, 0, 0);
const light_dir = new THREE.Vector3(0, 1, -1).normalize();

const stats = new Stats();
document.getElementById("container").appendChild(stats.dom);

const controls = {
  shadow: false,
  balloon: 50,
};
const gui = new GUI();
gui.add(controls, "shadow");
gui.add(controls, "balloon", 0, 100, 1);

// const orbit = new OrbitControls(camera, canvas);
// orbit.target.copy(look_at);
// orbit.minDistance = 5;
// orbit.maxDistance = 15;
// orbit.minPolarAngle = 0.1;
// orbit.maxPolarAngle = 2.7;
//orbit.update();

const textureloader = new THREE.TextureLoader();

const environment = textureloader.load("./src/studio.jpg", function (texture) {
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
});

const environment_blur = textureloader.load(
  "./src/studio-blur.jpg",
  function (texture) {
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
);

const ortho = new THREE.OrthographicCamera(0, 1, 1, -1, -1, 1);
const scene = new THREE.Scene();
// const material = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
//   side: THREE.DoubleSide,
// });

const material = new THREE.ShaderMaterial({
  uniforms: {
    s: { value: 1 / size / dpr },
    t: {},
    cam_pos: { value: camera.position },
    look_at: { value: look_at },
    light_dir: { value: light_dir },
    is_shadow: {},
    balloon: {},
    tex_env: { value: environment },
    tex_env_blur: { value: environment_blur },
    mouse: { value: new THREE.Vector2(0, 0) },
    resolution: {
      value: new THREE.Vector2(
        (window.innerWidth - size) / window.innerWidth,
        (window.innerHeight - size * 0.5) / window.innerHeight
      ),
    },
  },
  fragmentShader: `
		uniform float s, t;
		uniform vec3 cam_pos, look_at, light_dir;
		uniform bool is_shadow;
		uniform float balloon;
		uniform sampler2D tex_env, tex_env_blur;
		uniform vec2 mouse;
		uniform vec2 resolution;

	const float FAR = 20.0; // max view distance
    const float PI = 3.14159;
    const float e = 0.0001;

#define mouse (( mouse * 2.0 - 1.0) * 4.)

#define line( x0, y0, x1, y1){ \
	float sdf, m; \
	vec2 p0, v1, vp; \
	\
	p0 = vec2( x0, y0); \
	v1 = vec2( x1, y1) - p0; \
	sdf = length( v1); \
	vp = position - p0; \
	v1 /= sdf; \
	d = min( d, distance( vp, clamp( dot( vp, v1), 0.0, sdf) * v1)); \
}

float arc_dst( vec2 q, float t0, float t1){
	float r0, r1, tt;
	tt = t0 + fract( atan( q.y, q.x) / (PI * 2.) - t0);

	if( ( t0 <= t1 && tt <= t1) || ( t1 <= t0 && t1 + 1.0 <= tt)) return abs( length( q) - 1.0);

	r0 = (PI * 2.) * t0;
	r1 = (PI * 2.) * t1;
	return min(
		distance( q, vec2( cos( r0), sin( r0))),
		distance( q, vec2( cos( r1), sin( r1)))
	);
}

#define arc( cx, cy, r_, t0_, t1_){ \
	float sdf, r, r2, t0, t1, tt, tv; \
	vec2 q; \
	\
	r = float( r_); \
	t0 = 0.25 * float( t0_); \
	t1 = 0.25 * float( t1_); \
	\
	q = ( position - vec2( cx, cy)) / r; \
	d = min( d, arc_dst( q, t0, t1) * r); \
}


float shopify(int letter, vec2 q){
  float d = FAR;
  vec2 position = q + vec2(1,2);
  switch(letter){
    case 0 : // S
      arc(1,3,1,0,3);
      arc(1,1,1,1,-2);
      break;
    case 1 : // H
      line(0,4,0,0);
      line(0,2,2,2);
      line(2,4,2,0);
      break;
    case 2 : // O
      arc(1,3,1,1,2);
      line(0,3,0,1);
      arc(1,1,1,2,4);
      line(2,1,2,3);
      arc(1,3,1,0,1);
      break;
    case 3 : // P
      line(0,4,0,0);
      line(0,4,1,4);
      arc(1,3,1,1,-1);
      line(1,2,0,2);
      break;
    case 4 : // I
      line(0.5,4,1.5,4);
      line(1,4,1,0);
      line(0.5,0,1.5,0);
      break;
    case 5 : // F 
      line(0,4,0,0);
      line(0,4,2,4);
      line(0,2,2,2);
      break;
    case 6 : // Y
      line(0,4,1,2);
      line(2,4,1,2);
      line(1,2,1,0);
      break;
  }
  return d;
}

float chr( int normals, vec2 q){
	
	float d = 9.9;
	vec2 position = q + vec2( 1, 2);

	switch( normals){
	case 0: //★ A
		line( 1, 4, 0, 0)
		line( 1, 4, 2, 0)
		line( 0.25, 1, 1.75, 1)
		break;
	case 1: //★ B
		line( 0, 4, 0, 0)
		line( 0, 4, 1, 4)
		arc( 1, 3, 1, 1, -1)
		line( 1, 2, 0, 2)
		arc( 1, 1, 1, 1, -1)
		line( 1, 0, 0, 0)
		break;
	case 2: //★ C
		arc( 1, 3, 1, 0, 2)
		line( 0, 3, 0, 1)
		arc( 1, 1, 1, 2, 4)
		break;
	case 3: //★ D
		line( 0, 4, 0, 0)
		arc( 0, 2, 2, 1, -1)
		break;
	case 4: //★ E
		line( 0, 4, 0, 0)
		line( 0, 4, 2, 4)
		line( 0, 2, 2, 2)
		line( 0, 0, 2, 0)
		break;
	case 5: //★ F
		line( 0, 4, 0, 0)
		line( 0, 4, 2, 4)
		line( 0, 2, 2, 2)
		break;
	case 6: //★ G
		arc( 1, 3, 1, 0, 2)
		line( 0, 3, 0, 1)
		arc( 1, 1, 1, 2, 4)
		line( 2, 1, 2, 2)
		line( 1, 2, 2, 2)
		break;
	case 7: //★ H
		line( 0, 4, 0, 0)
		line( 0, 2, 2, 2)
		line( 2, 4, 2, 0)
		break;
	case 8: //★ I
		line( 0.5, 4, 1.5, 4)
		line( 1, 4, 1, 0)
		line( 0.5, 0, 1.5, 0)
		break;
	case 9: //★ J
		line( 1.5, 4, 2.5, 4)
		line( 2, 4, 2, 1)
		arc( 1, 1, 1, 0, -2)
		break;
	case 10: //★ K
		line( 0, 4, 0, 0)
		line( 2, 4, 0, 2)
		line( 0, 2, 2, 0)
		break;
	case 11: //★ L
		line( 0, 4, 0, 0)
		line( 0, 0, 2, 0)
		break;
	case 12: //★ M
		line( 0, 4, 0, 0)
		line( 0, 4, 1, 0)
		line( 1, 0, 2, 4)
		line( 2, 4, 2, 0)
		break;
	case 13: //★ N
		line( 0, 4, 0, 0)
		line( 0, 4, 2, 0)
		line( 2, 0, 2, 4)
		break;
	case 14: //★ O
		arc( 1, 3, 1, 1, 2)
		line( 0, 3, 0, 1)
		arc( 1, 1, 1, 2, 4)
		line( 2, 1, 2, 3)
		arc( 1, 3, 1, 0, 1)
		break;
	case 15: //★ P
		line( 0, 4, 0, 0)
		line( 0, 4, 1, 4)
		arc( 1, 3, 1, 1, -1)
		line( 1, 2, 0, 2)
		break;
	case 16: //★ Q
		arc( 1, 3, 1, 1, 2)
		line( 0, 3, 0, 1)
		arc( 1, 1, 1, 2, 4)
		line( 2, 1, 2, 3)
		arc( 1, 3, 1, 0, 1)
		line( 1, 1, 2, 0)
		break;
	case 17: //★ R
		line( 0, 4, 0, 0)
		line( 0, 4, 1, 4)
		arc( 1, 3, 1, 1, -1)
		line( 1, 2, 0, 2)
		line( 1, 2, 2, 0)
		break;
	case 18: //★ S
		arc( 1, 3, 1, 0, 3)
		arc( 1, 1, 1, 1, -2)
		break;
	case 19: //★ T
		line( 0, 4, 2, 4)
		line( 1, 4, 1, 0)
		break;
	case 20: //★ U
		line( 0, 4, 0, 1)
		arc( 1, 1, 1, 2, 4)
		line( 2, 1, 2, 4)
		break;
	case 21: //★ V
		line( 0, 4, 1, 0)
		line( 1, 0, 2, 4)
		break;
	case 22: //★ W
		line( 0, 4, 0.5, 0)
		line( 0.5, 1, 0, 4)
		line( 1, 4, 1.5, 0)
		line( 1.5, 0, 2, 4)
		break;
	case 23: //★ X
		line( 0, 4, 2, 0)
		line( 2, 4, 0, 0)
		break;
	case 24: //★ Y
		line( 0, 4, 1, 2)
		line( 2, 4, 1, 2)
		line( 1, 2, 1, 0)
		break;
	case 25: //★ Z
		line( 0, 4, 2, 4)
		line( 2, 4, 0, 0)
		line( 0, 0, 2, 0)
		break;
	}
	return d;
}

mat2 rot( float a){
  float s = sin( a);
  float c = cos( a);
  return mat2( c, s, -s, c);
}

float noise( float e){
	float i = floor( e);
	return mix(
		fract( 45678.5453 * i),
		fract( 43758.5453 * ( i + 1.0)),
		smoothstep( 0.0, 1.0, fract( e))
	);
}

# define progress mod(t * .5 + (r * 1.25) * PI * 2., PI * 2.0)

vec3 letters( vec3 a, vec3 position, int normals, float r, float hit){
  	float sdf, e;
	// circular pos	
  	//vec3 q = vec3( r * sin( hit), 2.0 + 2.0 * sin( r + 0.7 * t - hit), r * cos( hit));
 	// line position	
  	vec3 pos = vec3( (r - .5) * (7.5 + balloon * 2.) , -2.5 + sin(hit + (r-.5)*PI*2. ) * 0.25, 0.5-cos(hit + (r-.5)*PI*4. ) * 0.35);
	pos = position - pos;
	
	if( length( pos) - 1. < a.z){ 
		pos.xz *= rot(cos(progress) * .25);
		pos.xy *= rot( sin(progress)*.25);
		pos *= 3.0;
		sdf = length( vec2( shopify( normals, pos.xy), pos.z)) / 3.0
		- 0.1 - 0.3 * balloon;

		if( sdf < a.z){
			e = 9.0 * atan( pos.y, pos.x);
			sdf += balloon * (
				0.8 * pow( max( 0.0, 1.0 - ( 1.2 - 0.5 * balloon) * abs( pos.z)) * noise( e), 8.0) + 
				0.2 * pow( max( 0.0, 1.0 - ( 1.8 - 1.1 * balloon) * abs( pos.z)) * noise( 3.0 * e), 4.0)
				);
				a = vec3( 1, hit, sdf);
			}
		}
		return a;
	}
    
		vec3 scene( vec3 position, vec3 view){
			float i;
			float e;
			vec3 a = vec3( 1, 0, FAR);
			// inner ring
			//for( i = 0.0; i < 6.1; i++) a = letters( a, position, int( mod( i, 26.0)), 2.2, (PI * 2.) * i / 7.0 + 0.5 * t);
			// line
			//for( i = 0.0; i < 7.0; i++) a = letters( a, position, int( mod( i, 26.0)), (i/6.), 0.5 * t);
			// central shere
			e = length( position - vec3( 0.,0., 0.)) - 1.;
			if( e < a.z) a = vec3(1, 0, e);
			// ground
			/*
			if( v.y < 0.0){ 
				e = position.y + 1.5;
				if( e < a.z) a = vec3( 1, 3, e);
			}
			*/
			return a;
		}

		float shadow( vec3 o, vec3 v, float s){
			int i;
			float a, b, d;

			a = 1.0;
			b = 0.03; //★ 物体の表面から少し離れた位置からトレースを始める。
			for( i = 0; i < 9 && 0.03 < a && b < FAR; i++){
				d = scene( o + b * v, v).z;
				a = min( a, s * d / b);
				b += 1.4 * d; //★ 歩幅を割り増してループ回数を割り引く。
			}
			return max( a, 0.0);
		}

		vec3 getNormal(vec3 position, vec3 view, vec3 hit){
			return normalize( vec3(
				scene( position + vec3( e, 0, 0), view).z,
				scene( position + vec3( 0, e, 0), view).z,
				scene( position + vec3( 0, 0, e), view).z
			) - hit.z);
		}

		void main(){
			int i;
			float f;		
			//camera
			vec2 window = gl_FragCoord.xy * 2. * s -1.;
			//window = 2.0 * window * s - 1.0;
			vec3 position = cam_pos + vec3( 0, 0, 0);
			vec3 best_position = position;
			vec3 view = normalize( look_at - position);
			vec3 normals = normalize( cross( vec3( 0, 1, 0), view));
			mat3 cam_mat = mat3( -normals, normalize( cross( view, normals)), view);
			view = cam_mat * vec3( window * tan( 60.0 / 180.0 * PI), 1);
			view = normalize( view);

			//raymarching
			vec3 hit, best_hit, reflected, color;
			best_hit.z = FAR;
			float sdf = 0.0;
			float inShadow = 0.;
			for( i = 0; i < 64 && sdf < FAR; i++){
				hit = scene( position, view);
				if( hit.z < 0.001) break;
				if( hit.z < best_hit.z){ 
					best_hit = hit; 
					best_position = position;
				}
				sdf += hit.z;
				position += hit.z * view;
			}

			if( FAR <= sdf){ //★ 遠い。背景。
				color = texture( tex_env_blur, vec2(
					0.5 + 0.5 * atan( view.x, view.z) / 3.14159,
					pow( acos( -view.y) / 3.14159, 0.7) //★ 空を多めに。
				)).rgb * vec3(0.,0.5,1.0);
				color += 0.1 * vec3(0.,0.5,1.0);

			} else{
				if( 0.1 <= hit.z ){
					hit = best_hit; 
					position = best_position;
				};

				normals = getNormal( position,  view,  hit);
				reflected = reflect( view, normals);
				if( is_shadow
					&& hit.x < 2.1 //★ 1 : 地面 または 2 : 球体。
				) inShadow = shadow( position, reflected, 20.0); else inShadow = 1.0; //★ 向こう側の明るさが遮られる。
				/*
				if( hit.x < 1.1){
					
					//ground
					color = texture( tex_env_blur, vec2(
						0.5 + 0.5 * atan( view.x, view.z) / 3.14159,
						acos( -view.y) / 3.14159
					)).rgb;
					sdf = 0.333 * ( color.r + color.g + color.b);
					color = mix( vec3( smoothstep( 0.4, 0.6, sdf)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + hit.y), sin( 3.14159 * sdf));
					color *= 0.8;
					
				} else{
					*/
					// letters env map
					color = texture( tex_env_blur, vec2(
						0.5 + 0.5 * atan( reflected.x, reflected.z) / 3.14159,
						acos( -reflected.y) / 3.14159
					)).rgb;
					sdf = 0.333 * ( color.r + color.g + color.b);
					color *= vec3(0,.5 +sdf * 0.5,0);
					color = pow(color,vec3(1.5));
					//color = mix(color, vec3(0.1+pow(sdf,4.)), 1.-balloon);
					/*
					gradient coloring
					color = hit.x < 3.1 ? mix( vec3( smoothstep( 0.4, 0.6, sdf)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + 0.5 * r + 0.5 * position.y + hit.y), sin( 3.14159 * sdf)) //★ 法線カラーと縦グラデも。
					 : mix( vec3( smoothstep( 0.4, 0.6, sdf)), vec3( 1, 0, 0), sin( 3.14159 * sdf)); //★ くちびるの色。
					
					}
					*/

				//color *= 0.3 + 0.7 * inShadow;
			}
			color = pow(color,vec3(1./2.2));
			gl_FragColor = vec4( vec3(color), 1);
		}
	`,
});
console.log(material);
plane.material = material;
scene.add(plane);
renderer.render(scene, ortho);

let count = 0;
animate();

window.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  material.uniforms.mouse.value = new THREE.Vector2(x, y);
});
/*
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  ortho.aspect = width / height;
  ortho.updateProjectionMatrix();
});
*/
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.t.value = count;
  material.uniforms.is_shadow.value = controls.shadow;
  material.uniforms.balloon.value = controls.balloon / 100;
  renderer.render(scene, ortho);
  stats.update();
  //orbit.update();
  count = count + 0.02;
}
