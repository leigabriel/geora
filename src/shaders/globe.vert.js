export const DOT_VERTEX = `
  attribute float aLand;
  attribute float aBorder;
  attribute float aScatter;
  varying float vLand;
  varying float vBorder;
  varying float vLighting;
  uniform float uDotScale;
  uniform float uAmbient;
  uniform float uContrast;
  uniform float uDensity;
  uniform float uDetail;
  uniform float uShowBorders;

  void main() {
    vLand = aLand;
    vBorder = aBorder * uShowBorders;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vec3 norm = normalize(mat3(modelMatrix) * position);
    float front = max(dot(norm, normalize(vec3(2.5, 3.0, 4.0))), 0.0);
    float back = max(dot(norm, normalize(vec3(-2.0, -1.8, -3.5))), 0.0) * 0.45;
    float lighting = uAmbient + (front + back) * (1.0 - uAmbient);
    // contrast pivots the lighting around mid grey, which tightens or
    // flattens the terminator without touching the palette
    vLighting = clamp((lighting - 0.5) * uContrast + 0.5, 0.0, 1.4);

    // halftone density culls an even, stable subset of the cloud; the visual
    // profile's detail level scales how much of what is left survives, so the
    // pattern thins evenly instead of randomly
    if (aScatter > uDensity * uDetail) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    float baseSize = mix(2.2, 5.2, aLand);
    if (vBorder > 0.3) baseSize += 1.4;

    float distFactor = 320.0 / -mvPosition.z;
    gl_PointSize = baseSize * uDotScale * (0.85 + 0.28 * vLighting) * distFactor * 0.016;
  }
`
