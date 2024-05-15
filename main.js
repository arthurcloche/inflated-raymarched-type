import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
console.clear();

const size = 1024;

const canvas = document.getElementById("canvas");
canvas.width = size;
canvas.height = size * 0.5;
console.log(canvas);
const dpr = window.devicePixelRatio / window.devicePixelRatio;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(dpr);
renderer.autoClear = false;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));

const camera = new THREE.PerspectiveCamera(20, 1 / 1, 0.01, 300);
camera.position.set(0, 0, 10);
const look_at = new THREE.Vector3(0, 2, 0);
const light_dir = new THREE.Vector3(-1, 1, -2).normalize();

const stats = new Stats();
document.getElementById("container").appendChild(stats.dom);

const controls = {
  shadow: false,
  balloon: 50,
};
const gui = new GUI();
gui.add(controls, "shadow");
gui.add(controls, "balloon", 0, 100, 1);

const orbit = new OrbitControls(camera, canvas);
orbit.target.copy(look_at);
orbit.minDistance = 5;
orbit.maxDistance = 15;
orbit.minPolarAngle = 0.1;
orbit.maxPolarAngle = 2.7;
orbit.update();

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
  },
  fragmentShader: `
		uniform float s, t;
		uniform vec3 cam_pos, look_at, light_dir;
		uniform bool is_shadow;
		uniform float balloon;
		uniform sampler2D tex_env, tex_env_blur;

		const float FAR = 20.0; // max view distance
    const float PI = 3.14159;
    
#define line( x0, y0, x1, y1){ \
	float g, m; \
	vec2 p0, v1, vp; \
	\
	p0 = vec2( x0, y0); \
	v1 = vec2( x1, y1) - p0; \
	g = length( v1); \
	vp = p - p0; \
	v1 /= g; \
	d = min( d, distance( vp, clamp( dot( vp, v1), 0.0, g) * v1)); \
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
	float g, r, r2, t0, t1, tt, tv; \
	vec2 q; \
	\
	r = float( r_); \
	t0 = 0.25 * float( t0_); \
	t1 = 0.25 * float( t1_); \
	\
	q = ( p - vec2( cx, cy)) / r; \
	d = min( d, arc_dst( q, t0, t1) * r); \
}


float shopify(int letter, vec2 q){

  float d = 9.9;
  vec2 p = q + vec2(1,2);
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

float chr( int n, vec2 q){
	
	float d = 9.9;
	vec2 p = q + vec2( 1, 2);

	switch( n){
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

vec3 letters( vec3 a, vec3 p, int n, float r, float h){
  float d, e;

	//vec3 q = vec3( r * sin( h), 2.0 + 2.0 * sin( r + 0.7 * t - h), r * cos( h));
	vec3 q = vec3( (r - .5) * 7.5 , sin(h + (r-.5)*PI*2. ) * 0.25, 0.0);

	
	q = p - q;
			if( length( q) - 0.8 < a.z){ 
				q.xz *= rot( t * r - h);

				q.xy *= rot( 0.2 * sin( 1.5 * r * t));

				q *= 3.0;
				d = length( vec2( shopify( n, q.xy), q.z)) / 3.0
					- 0.1 - 0.3 * balloon;

				if( d < a.z){
					e = 9.0 * atan( q.y, q.x);
					d += balloon * (
						0.8 * pow( max( 0.0, 1.0 - ( 1.2 - 0.5 * balloon) * abs( q.z)) * noise( e), 8.0) + 
						0.2 * pow( max( 0.0, 1.0 - ( 1.8 - 1.1 * balloon) * abs( q.z)) * noise( 3.0 * e), 4.0)
					);
					a = vec3( 3, h, d);
				}
			}
			return a;
		}
    
		vec3 scene( vec3 p, vec3 v){
			float i;
			float e;

			vec3 a = vec3( 1, 0, 99);

			// inner ring
			//for( i = 0.0; i < 6.1; i++) a = letters( a, p, int( mod( i, 26.0)), 2.2, (PI * 2.) * i / 7.0 + 0.5 * t);
			for( i = 0.0; i < 6.1; i++) a = letters( a, p, int( mod( i, 26.0)), (i/6.), 0.5 * t);
			// outer ring
			//for( i = 0.0; i < 12.1; i++) a = letters( a, p, int( mod( 7.0 + i, 26.0)), 3.6, 0.26 + (PI * 2.) * i / 13.0 - 0.4 * t);

			// central shere
			//e = length( p - vec3( 0, 1.55 + 0.2 * sin( 5.0 * t), 0)) - 1.3;
			//if( e < a.z) a = vec3( 2, 0, e);

			// ground
			/*
			if( v.y < 0.0){ 
				e = p.y + 1.5;
				if( e < a.z) a = vec3( 1, 3, e);
			}
			*/
			return vec3(a.x,a.y,a.z);
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

		void main(){
			int i;
			float f, g, s_0;
			vec2 w;
			vec3 n, p, r, best_p;
			vec3 color;
			vec3 h, best_h;
			//ivec2 iw;
			mat3 cam_mat;
			vec3 view;
			vec3 reflected;
			const float e = 0.001;

			w = gl_FragCoord.xy;
			//iw = ivec2( w);
			w = 2.0 * w * s - 1.0;

			//★ 視線の変換行列を求める。
			p = cam_pos;
			view = normalize( look_at - p);
			n = normalize( cross( vec3( 0, 1, 0), view));
			cam_mat = mat3( -n, normalize( cross( view, n)), view);

			view = cam_mat * vec3( w * tan( 30.0 / 180.0 * 3.14159), 1); //★ 視線を PerspectiveCamera (FOV 40) と一致させる。(半分の 20 で指定。)
			view = normalize( view); //★ デプスバッファと比較する場合はノーマライズしない (？)

			//◍◍◍◍◍◍◍◍◍◍

			best_h.z = FAR;
			g = 0.0;
			for( i = 0; i < 40 && g < FAR; i++){
				h = scene( p, view);
				if( h.z < 0.001) break;
				if( h.z < best_h.z){ best_h = h; best_p = p;}
				g += h.z;
				p += h.z * view;
			}

			if( FAR <= g){ //★ 遠い。背景。
				color = texture( tex_env_blur, vec2(
					0.5 + 0.5 * atan( view.x, view.z) / 3.14159,
					pow( acos( -view.y) / 3.14159, 0.7) //★ 空を多めに。
				)).rgb;
				color += 0.1; //★ 空気遠近法。

			} else{
				if( 0.001 <= h.z){ h = best_h; p = best_p;} //★ 物体の表面にたどり着けなかったら、ここまでで表面にいちばん近かった位置を採用。

				n = normalize( vec3( //★ 法線。
					scene( p + vec3( e, 0, 0), view).z,
					scene( p + vec3( 0, e, 0), view).z,
					scene( p + vec3( 0, 0, e), view).z
				) - h.z);

				reflected = reflect( view, n);
				if( is_shadow
					&& h.x < 2.1 //★ 1 : 地面 または 2 : 球体。
				) s_0 = shadow( p, reflected, 20.0); else s_0 = 1.0; //★ 向こう側の明るさが遮られる。

				if( h.x < 1.1){
					//ground
					
					color = texture( tex_env_blur, vec2(
						0.5 + 0.5 * atan( view.x, view.z) / 3.14159,
						acos( -view.y) / 3.14159
					)).rgb;
					g = 0.333 * ( color.r + color.g + color.b);
					//color = mix( vec3( smoothstep( 0.4, 0.6, g)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + h.y), sin( 3.14159 * g));
					//color *= 0.8;

				} else{
					// letters
					color = texture( tex_env_blur, vec2(
						0.5 + 0.5 * atan( reflected.x, reflected.z) / 3.14159,
						acos( -reflected.y) / 3.14159
					)).rgb;
					g = 0.333 * ( color.r + color.g + color.b);
					color *= vec3(0,.7 +g * 1.3,0);
					color = pow(color,vec3(1.5));
					/*
					color = h.x < 3.1 ? mix( vec3( smoothstep( 0.4, 0.6, g)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + 0.5 * r + 0.5 * p.y + h.y), sin( 3.14159 * g)) //★ 法線カラーと縦グラデも。
					 : mix( vec3( smoothstep( 0.4, 0.6, g)), vec3( 1, 0, 0), sin( 3.14159 * g)); //★ くちびるの色。
					*/
					}

				color *= 0.3 + 0.7 * s_0;
			}

			gl_FragColor = vec4( color, 1);
		}
	`,
});

plane.material = material;
scene.add(plane);
renderer.render(scene, ortho);

let count = 0;
animate();

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.t.value = count;
  material.uniforms.is_shadow.value = controls.shadow;
  material.uniforms.balloon.value = controls.balloon / 100;
  renderer.render(scene, ortho);
  stats.update();
  count = count + 0.02;
}
