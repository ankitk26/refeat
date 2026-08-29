/**
 * PixelScene — a living pixel-art meadow straight out of the reference pin:
 * dusty-blue sky, a pixel sun, drifting cream clouds, olive pines and a
 * lime meadow. Pure SVG, crisp edges, CSS-animated clouds.
 */
export default function PixelScene({
	className = "",
	night = false,
}: {
	className?: string;
	night?: boolean;
}) {
	const skyTop = night ? "#3d5a67" : "#7ea7bb";
	const skyBottom = night ? "#48606e" : "#a9c6d3";
	return (
		<svg
			viewBox="0 0 120 54"
			shapeRendering="crispEdges"
			className={`pixelated block w-full ${className}`}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={skyTop} />
					<stop offset="1" stopColor={skyBottom} />
				</linearGradient>
			</defs>

			{/* sky */}
			<rect width="120" height="54" fill="url(#px-sky)" />

			{/* pixel sun */}
			<g fill="#eef0dc" opacity="0.9">
				<rect x="102" y="4" width="6" height="6" />
				<rect x="100" y="6" width="10" height="2" />
				<rect x="104" y="2" width="2" height="10" />
			</g>

			{/* drifting clouds */}
			<g
				fill="#eef0dc"
				style={{ animation: "drift 8s ease-in-out infinite alternate" }}
			>
				<rect x="14" y="8" width="16" height="4" />
				<rect x="18" y="5" width="10" height="3" />
				<rect x="22" y="3" width="6" height="2" />
				<rect x="14" y="12" width="16" height="1" fill="#dde4c4" />
			</g>
			<g
				fill="#eef0dc"
				style={{
					animation: "drift 11s ease-in-out infinite alternate-reverse",
				}}
			>
				<rect x="66" y="12" width="12" height="3" />
				<rect x="70" y="9" width="7" height="3" />
				<rect x="66" y="15" width="12" height="1" fill="#dde4c4" />
			</g>

			{/* far hills */}
			<rect y="30" width="120" height="24" fill="#a9bd63" />
			<rect y="28" width="34" height="2" fill="#a9bd63" />
			<rect y="26" width="22" height="2" fill="#a9bd63" />
			<rect y="29" width="46" height="1" fill="#8ba14e" />

			{/* pines — left cluster */}
			<g>
				<rect x="10" y="18" width="4" height="12" fill="#5c7340" />
				<rect x="9" y="20" width="6" height="4" fill="#5c7340" />
				<rect x="9" y="16" width="6" height="3" fill="#8ba14e" />
				<rect x="11" y="13" width="2" height="3" fill="#8ba14e" />

				<rect x="20" y="21" width="3" height="9" fill="#4a5f36" />
				<rect x="19" y="23" width="5" height="3" fill="#4a5f36" />
				<rect x="20" y="19" width="3" height="3" fill="#5c7340" />
			</g>

			{/* pines — right cluster */}
			<g>
				<rect x="88" y="16" width="5" height="14" fill="#3d5233" />
				<rect x="87" y="19" width="7" height="5" fill="#3d5233" />
				<rect x="89" y="12" width="3" height="4" fill="#5c7340" />

				<rect x="100" y="22" width="4" height="8" fill="#4a5f36" />
				<rect x="99" y="24" width="6" height="4" fill="#4a5f36" />
			</g>

			{/* meadow shadow rows */}
			<g fill="#8ba14e">
				<rect y="38" width="120" height="2" />
				<rect y="46" width="120" height="2" />
			</g>
			<g fill="#6e8540">
				<rect y="40" width="120" height="1" />
				<rect y="48" width="120" height="1" />
			</g>
			{/* deep grass foreground */}
			<rect y="50" width="120" height="4" fill="#5c7340" />
			<g fill="#4a5f36">
				<rect x="8" y="49" width="2" height="1" />
				<rect x="30" y="49" width="2" height="1" />
				<rect x="57" y="49" width="2" height="1" />
				<rect x="83" y="49" width="2" height="1" />
				<rect x="108" y="49" width="2" height="1" />
			</g>
		</svg>
	);
}
