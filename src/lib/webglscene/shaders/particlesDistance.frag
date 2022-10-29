
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;

#include <common>
#include <packing>

void main () {

	//make particles round
	vec2 toCenter = ( gl_PointCoord.xy - 0.5 ) * 2.0;
	float len = length( toCenter );
	if ( len > 0.8 ) discard;

   float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist ); // clamp to [ 0, 1 ]
	gl_FragColor = packDepthToRGBA( dist );
}