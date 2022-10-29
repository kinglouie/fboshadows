
uniform sampler2D texturePosition;

varying vec3 vWorldPosition;

void main() {
	vec3 pos = texture2D( texturePosition, position.xy ).xyz;
	vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPosition;

	
	vWorldPosition = worldPosition.xyz;
	

	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = 50.0 / length( mvPosition.xyz );
}