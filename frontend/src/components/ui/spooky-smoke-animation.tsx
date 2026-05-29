import React, { useEffect, useRef } from "react";

const FRAG_SHADER = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;
#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}
void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);
  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);
  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);
  col=mix(col,u_color,dot(col,vec3(.21,.71,.07)));
  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

const VERT_SHADER = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255] : null;
};

interface SmokeBackgroundProps {
  smokeColor?: string;
}

export const SmokeBackground: React.FC<SmokeBackgroundProps> = ({ smokeColor = "#808080" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef<[number, number, number]>([0.5, 0.5, 0.5]);

  useEffect(() => {
    const rgb = hexToRgb(smokeColor);
    if (rgb) colorRef.current = rgb;
  }, [smokeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT_SHADER));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "time");
    const resLoc = gl.getUniformLocation(program, "resolution");
    const colorLoc = gl.getUniformLocation(program, "u_color");

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let id: number;
    const loop = (now: number) => {
      gl.uniform1f(timeLoc, now * 1e-3);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform3fv(colorLoc, colorRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(id);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};
