import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const W = 512;
let o;

const can = document.getElementById("canvas_1");
can.width = can.height = W;

const dpr = 1.5;
//const dpr = window.devicePixelRatio; //★ ← Mac で 2。iPhone で 3。等になる。
const ren = new THREE.WebGLRenderer({ canvas: can });
ren.setPixelRatio(dpr);
ren.autoClear = false;
//ren.setClearColor( 0x000000, 0);

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));

const cam = new THREE.PerspectiveCamera(40, 1 / 1, 0.01, 300);
cam.position.set(2, 9, 9);
const look_at = new THREE.Vector3(0, 3, 0);
const light_dir = new THREE.Vector3(-1, 1, -2).normalize();

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

const my_stats = new Stats();
document.getElementById("container_1").appendChild(my_stats.dom);

//◍◍◍◍◍◍◍◍◍◍

const ctr = {
  shadow: true,
  balloon: 50,
};
o = new GUI();
o.add(ctr, "shadow");
o.add(ctr, "balloon", 0, 100, 1);

//◍◍◍◍◍◍◍◍◍◍

o = new OrbitControls(cam, can);
o.target.copy(look_at);
o.minDistance = 5;
o.maxDistance = 15;
o.minPolarAngle = 0.1;
o.maxPolarAngle = 2.7;
o.update();

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

const tl = new THREE.TextureLoader();

const tex_env = tl.load("cafe.jpg", function (t) {});
tex_env.minFilter = THREE.LinearFilter;
tex_env.wrapS = tex_env.wrapT = THREE.RepeatWrapping;

const tex_env_blur = tl.load("cafe_blur.jpg", function (t) {});
tex_env_blur.minFilter = THREE.LinearFilter;
tex_env_blur.wrapS = tex_env_blur.wrapT = THREE.RepeatWrapping;

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

const cam_o = new THREE.OrthographicCamera(0, 1, 1, -1, -1, 1);

const scene_o = new THREE.Scene();
scene_o.add(plane);

const mat = new THREE.ShaderMaterial({
  uniforms: {
    s: { value: 1 / W / dpr },
    t: {},
    cam_pos: { value: cam.position },
    look_at: { value: look_at },
    light_dir: { value: light_dir },
    is_shadow: {},
    balloon: {},
    tex_env: { value: tex_env },
    tex_env_blur: { value: tex_env_blur },
  },
  fragmentShader: `
		uniform float s, t;
		uniform vec3 cam_pos, look_at, light_dir;
		uniform bool is_shadow;
		uniform float balloon;
		uniform sampler2D tex_env, tex_env_blur;

		const float FAR = 20.0; //★ これより遠くは見えない。

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

	tt = t0 + fract( atan( q.y, q.x) / 6.28318 - t0);

	//★ 円弧の途中。
	if( ( t0 <= t1 && tt <= t1) || ( t1 <= t0 && t1 + 1.0 <= tt)) return abs( length( q) - 1.0);

	//★ 円弧の端。
	r0 = 6.28318 * t0;
	r1 = 6.28318 * t1;
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

float chr( int n, vec2 q){
	float d;
	vec2 p;

	d = 9.9;
	p = q + vec2( 1, 2);

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
			float s, c;

			s = sin( a);
			c = cos( a);
			return mat2( c, s, -s, c);
		}

		float noise( float e){
			float i;

			i = floor( e);
			return mix(
				fract( 45678.5453 * i),
				fract( 43758.5453 * ( i + 1.0)),
				smoothstep( 0.0, 1.0, fract( e))
			);
		}

		vec3 moji( vec3 a, vec3 p, int n, float r, float h){
			float d, e;
			vec3 q;

			q = vec3( r * sin( h), 2.0 + 1.0 * sin( r + 0.7 * t - h), r * cos( h)); //★ 文字の中心座標。
			q = p - q;
			if( length( q) - 0.8 < a.z){ //★ バウンディング球体を妄想してカリング。
				q.xz *= rot( t * r - h); //★ 横回転。
				q.xy *= rot( 0.3 * sin( 1.5 * r * t)); //★ かしげ。

				q *= 3.0;
				d = length( vec2( chr( n, q.xy), q.z)) / 3.0
					- 0.1 - 0.3 * balloon; //★ 文字の太さ。

				if( d < a.z){
					e = 9.0 * atan( q.y, q.x);
					d += balloon * (
						0.8 * pow( max( 0.0, 1.0 - ( 1.2 - 0.5 * balloon) * abs( q.z)) * noise( e), 8.0) + //★ 粗いシワ。
						0.2 * pow( max( 0.0, 1.0 - ( 1.8 - 1.1 * balloon) * abs( q.z)) * noise( 3.0 * e), 4.0) //★ 細かいシワ。
					);
					a = vec3( 3, h, d);
				}
			}
			return a;
		}

		float lip( vec3 p){
			float d, r, x, y0, y1, y;
			vec3 q;

			q = vec3( 0, 3.8 + 0.8 * balloon + 0.2 * sin( 0.7 * t), 0); //★ くちびるの中心座標。
			q = 1.2 * ( p - q); //★ ローカル座標。
			//q.xz *= rot( t); //★ 横回転。
			q.xy *= rot( 0.2 * sin( 4.0 * t)); //★ かしげ。
			q.x = abs( q.x); //★ 折りたたみ。

			x = min( 1.5, q.x);

			y0 = x < 0.6 ? 0.45 + 0.15 * smoothstep( 0.0, 0.6, x) : 0.6 * smoothstep( 4.0, 0.6, x); //★ 上くちびる。
			y0 += 0.1 * x * x * sin( 10.0 * t); //★ 口角上げ下げ。

			y1 = -0.4 + 0.25 * x * x * x; //★ 下くちびる。
			y1 += 0.1 * x * x * sin( 10.0 * t); //★ 口角上げ下げ。

			y = clamp( q.y, y1, y0);

			r = 0.6 - 0.8 * smoothstep( 0.0, 3.0, x)
				- 1.5 * min( ( y0 - y) * ( y0 - y) * ( y0 - y), ( y - y1) * ( y - y1) * ( y - y1));
			r *= 0.3 + 1.4 * balloon;

			d = length( vec2( length( q.xy - vec2( x, y)), q.z)) / 1.2 - r;
			r = max( 0.0, -0.1 + 2.0 * ( 1.5 - balloon) * min( r, abs( q.z)));
			return d + balloon * (
				0.5 * pow( r * noise( 3.0 * x), 4.0) + //★ 粗いシワ。
				0.03 * pow( r * noise( 13.0 * x), 4.0) //★ 細かいシワ。
			);
		}

		vec3 peek( vec3 p, vec3 v){
			float i;
			float e;
			vec3 a;

			a = vec3( 1, 0, 99);

			//★ 内周の文字。
			for( i = 0.0; i < 6.1; i++) a = moji( a, p, int( mod( i, 26.0)), 2.2, 6.28318 * i / 7.0 + 0.5 * t);

			//★ 外周の文字。
			for( i = 0.0; i < 12.1; i++) a = moji( a, p, int( mod( 7.0 + i, 26.0)), 3.6, 0.26 + 6.28318 * i / 13.0 - 0.4 * t);

			//★ 球体。
			e = length( p - vec3( 0, 1.55 + 0.2 * sin( 5.0 * t), 0)) - 1.3;
			if( e < a.z) a = vec3( 2, 0, e);

			//★ くちびる。
			e = lip( p);
			if( e < a.z) a = vec3( 4, 0, e);

			if( v.y < 0.0){ //★ 視線が下向き。
				//★ 地面。
				e = p.y / -v.y;
				if( e < a.z) a = vec3( 1, 3, e);
			}

			return a;
		}

		float shadow( vec3 o, vec3 v, float s){
			int i;
			float a, b, d;

			a = 1.0;
			b = 0.03; //★ 物体の表面から少し離れた位置からトレースを始める。
			for( i = 0; i < 9 && 0.03 < a && b < FAR; i++){
				d = peek( o + b * v, v).z;
				a = min( a, s * d / b);
				b += 1.4 * d; //★ 歩幅を割り増してループ回数を割り引く。
			}
			return max( a, 0.0);
		}

		void main(){
			int i;
			float f, g, s_0;
			vec2 w;
			vec3 n, p, r, v, best_p;
			vec3 c;
			vec3 h, best_h;
			//ivec2 iw;
			mat3 cam_mat;

			const float e = 0.001; //★ 偏微分用。

			w = gl_FragCoord.xy;
			//iw = ivec2( w);
			w = 2.0 * w * s - 1.0;

			//★ 視線の変換行列を求める。
			p = cam_pos;
			v = normalize( look_at - p);
			n = normalize( cross( vec3( 0, 1, 0), v));
			cam_mat = mat3( -n, normalize( cross( v, n)), v);

			v = cam_mat * vec3( w * tan( 20.0 / 180.0 * 3.14159), 1); //★ 視線を PerspectiveCamera (FOV 40) と一致させる。(半分の 20 で指定。)
			v = normalize( v); //★ デプスバッファと比較する場合はノーマライズしない (？)

			//◍◍◍◍◍◍◍◍◍◍

			best_h.z = FAR;
			g = 0.0;
			for( i = 0; i < 40 && g < FAR; i++){
				h = peek( p, v);
				if( h.z < 0.001) break;
				if( h.z < best_h.z){ best_h = h; best_p = p;}
				g += h.z;
				p += h.z * v;
			}

			if( FAR <= g){ //★ 遠い。背景。
				c = texture( tex_env_blur, vec2(
					0.5 + 0.5 * atan( v.x, v.z) / 3.14159,
					pow( acos( -v.y) / 3.14159, 0.7) //★ 空を多めに。
				)).rgb;
				c += 0.1; //★ 空気遠近法。

			} else{
				if( 0.001 <= h.z){ h = best_h; p = best_p;} //★ 物体の表面にたどり着けなかったら、ここまでで表面にいちばん近かった位置を採用。

				n = normalize( vec3( //★ 法線。
					peek( p + vec3( e, 0, 0), v).z,
					peek( p + vec3( 0, e, 0), v).z,
					peek( p + vec3( 0, 0, e), v).z
				) - h.z);

				r = reflect( v, n);
				if( is_shadow
					&& h.x < 2.1 //★ 1 : 地面 または 2 : 球体。
				) s_0 = shadow( p, r, 20.0); else s_0 = 1.0; //★ 向こう側の明るさが遮られる。

				if( h.x < 1.1){
					//★ 地面。
					c = texture( tex_env_blur, vec2(
						0.5 + 0.5 * atan( r.x, r.z) / 3.14159,
						acos( -r.y) / 3.14159
					)).rgb;
					g = 0.333 * ( c.r + c.g + c.b);
					c = mix( vec3( smoothstep( 0.4, 0.6, g)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + h.y), sin( 3.14159 * g));
					c *= 0.8;

				} else{
					//★ メタリック。
					c = texture( tex_env, vec2(
						0.5 + 0.5 * atan( r.x, r.z) / 3.14159,
						acos( -r.y) / 3.14159
					)).rgb;
					g = 0.333 * ( c.r + c.g + c.b);
					c = h.x < 3.1 ? mix( vec3( smoothstep( 0.4, 0.6, g)), 0.5 + 0.5 * cos( vec3( 0, 2, 4) + 0.5 * r + 0.5 * p.y + h.y), sin( 3.14159 * g)) //★ 法線カラーと縦グラデも。
					: mix( vec3( smoothstep( 0.4, 0.6, g)), vec3( 1, 0, 0), sin( 3.14159 * g)); //★ くちびるの色。
				}

				c *= 0.3 + 0.7 * s_0;
			}

			gl_FragColor = vec4( c, 1);
		}
	`,
});

//◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍ ◍◍◍◍◍◍◍◍◍◍

let count;

count = 0;
tic();

function tic() {
  requestAnimationFrame(tic);

  mat.uniforms.t.value = 0.015 * count;
  mat.uniforms.is_shadow.value = ctr.shadow;
  mat.uniforms.balloon.value = ctr.balloon / 100;
  plane.material = mat;
  ren.render(scene_o, cam_o);

  my_stats.update();

  count++;
}
