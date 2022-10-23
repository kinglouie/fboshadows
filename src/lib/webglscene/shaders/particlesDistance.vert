uniform sampler2D texturePosition;

varying vec4 vWorldPosition;

void main() {
	vec3 pos = texture2D( texturePosition, position.xy ).xyz;
	vec4 worldPosition = modelMatrix * vec4( pos.xyz, 1.0 );
	vec4 mvPosition = viewMatrix * worldPosition;

	vWorldPosition = worldPosition;

	gl_Position = projectionMatrix * mvPosition;
	//gl_PointSize = 1.0;
	gl_PointSize = 50.0 / length( mvPosition.xyz );
}