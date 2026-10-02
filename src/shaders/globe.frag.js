export const DOT_FRAGMENT = `
  precision mediump float;
  varying float vLand;
  varying float vBorder;
  varying float vLighting;
  uniform vec3 uColor;
  uniform vec3 uBorderColor;
  uniform float uOceanOpacity;
  uniform float uThreshold;
  uniform float uIntensity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float delta = fwidth(dist);
    float alpha = 1.0 - smoothstep(uThreshold - delta, uThreshold + 0.06, dist);

    vec3 toneColor = vBorder > 0.3 ? uBorderColor : uColor;
    float dotAlpha = vBorder > 0.3 ? 1.0 : mix(uOceanOpacity, 0.98, vLand);
    dotAlpha *= 0.75 + 0.25 * vLighting;
    dotAlpha *= uIntensity;

    gl_FragColor = vec4(toneColor, alpha * dotAlpha);
  }
`
