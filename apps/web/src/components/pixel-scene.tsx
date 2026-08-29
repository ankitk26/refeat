/**
 * PixelScene — a living pixel-art meadow straight out of the reference pin:
 * dusty-blue sky, a pixel sun, drifting cream clouds, olive pines and a
 * lime meadow. Pure SVG, crisp edges, CSS-animated clouds.
 * Night variant swaps to a moonlit palette: deep slate sky, crescent moon,
 * dimmed clouds and a dark olive meadow.
 */

const DAY_PALETTE = {
	skyTop: "#7ea7bb",
	skyBottom: "#a9c6d3",
	celestial: "#eef0dc",
	cloud: "#eef0dc",
	cloudShade: "#dde4c4",
	hill: "#a9bd63",
	hillShade: "#8ba14e",
	pineLight: "#8ba14e",
	pineMid: "#5c7340",
	pineDark: "#4a5f36",
	pineDeepest: "#3d5233",
	meadowShadow: "#8ba14e",
	meadowDeepRow: "#6e8540",
	deepGrass: "#5c7340",
	grassTuft: "#4a5f36",
};

const NIGHT_PALETTE = {
	skyTop: "#1c2b38",
	skyBottom: "#2a4254",
	celestial: "#e8efd9",
	cloud: "#93a68a",
	cloudShade: "#7c8f74",
	hill: "#4f6a3a",
	hillShade: "#42592f",
	pineLight: "#46613a",
	pineMid: "#39502e",
	pineDark: "#2e422a",
	pineDeepest: "#263622",
	meadowShadow: "#42592f",
	meadowDeepRow: "#33452a",
	deepGrass: "#2c3d25",
	grassTuft: "#24331f",
};

/** 1×1 pixel stars, only visible in the night sky */
const STAR_POSITIONS = [
	{ x: 30, y: 6 },
	{ x: 52, y: 12 },
	{ x: 78, y: 5 },
	{ x: 93, y: 20 },
	{ x: 12, y: 22 },
	{ x: 44, y: 20 },
];

export default function PixelScene({
	className = "",
	night = false,
}: {
	className?: string;
	night?: boolean;
}) {
	const palette = night ? NIGHT_PALETTE : DAY_PALETTE;

	return (
		<svg
			viewBox="0 0 120 54"
			// False positive: shapeRendering is React's fixed DOM name for the SVG
			// shape-rendering presentation attribute, not a domain symbol.
			// oxlint-disable-next-line anti-slop/no-shape-in-symbol-names
			shapeRendering="crispEdges"
			className={`pixelated block w-full ${className}`}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={palette.skyTop} />
					<stop offset="1" stopColor={palette.skyBottom} />
				</linearGradient>
			</defs>

			{/* sky */}
			<rect width="120" height="54" fill="url(#px-sky)" />

			{/* stars — night only */}
			{night && (
				<g fill={palette.celestial} opacity="0.7">
					{STAR_POSITIONS.map((star) => (
						<rect
							key={`${star.x}-${star.y}`}
							x={star.x}
							y={star.y}
							width="1"
							height="1"
						/>
					))}
				</g>
			)}

			{/* day: pixel sun · night: crescent moon */}
			{night ? (
				<g fill={palette.celestial} opacity="0.9">
					<rect x="102" y="3" width="2" height="7" />
					<rect x="104" y="2" width="2" height="2" />
					<rect x="104" y="9" width="2" height="2" />
					<rect x="106" y="3" width="1" height="1" />
					<rect x="106" y="9" width="1" height="1" />
				</g>
			) : (
				<g fill={palette.celestial} opacity="0.9">
					<rect x="102" y="4" width="6" height="6" />
					<rect x="100" y="6" width="10" height="2" />
					<rect x="104" y="2" width="2" height="10" />
				</g>
			)}

			{/* drifting clouds */}
			<g
				fill={palette.cloud}
				style={{ animation: "drift 8s ease-in-out infinite alternate" }}
			>
				<rect x="14" y="8" width="16" height="4" />
				<rect x="18" y="5" width="10" height="3" />
				<rect x="22" y="3" width="6" height="2" />
				<rect x="14" y="12" width="16" height="1" fill={palette.cloudShade} />
			</g>
			<g
				fill={palette.cloud}
				style={{
					animation: "drift 11s ease-in-out infinite alternate-reverse",
				}}
			>
				<rect x="66" y="12" width="12" height="3" />
				<rect x="70" y="9" width="7" height="3" />
				<rect x="66" y="15" width="12" height="1" fill={palette.cloudShade} />
			</g>

			{/* far hills */}
			<rect y="30" width="120" height="24" fill={palette.hill} />
			<rect y="28" width="34" height="2" fill={palette.hill} />
			<rect y="26" width="22" height="2" fill={palette.hill} />
			<rect y="29" width="46" height="1" fill={palette.hillShade} />

			{/* pines — left cluster */}
			<g>
				<rect x="10" y="18" width="4" height="12" fill={palette.pineMid} />
				<rect x="9" y="20" width="6" height="4" fill={palette.pineMid} />
				<rect x="9" y="16" width="6" height="3" fill={palette.pineLight} />
				<rect x="11" y="13" width="2" height="3" fill={palette.pineLight} />

				<rect x="20" y="21" width="3" height="9" fill={palette.pineDark} />
				<rect x="19" y="23" width="5" height="3" fill={palette.pineDark} />
				<rect x="20" y="19" width="3" height="3" fill={palette.pineMid} />
			</g>

			{/* pines — right cluster */}
			<g>
				<rect x="88" y="16" width="5" height="14" fill={palette.pineDeepest} />
				<rect x="87" y="19" width="7" height="5" fill={palette.pineDeepest} />
				<rect x="89" y="12" width="3" height="4" fill={palette.pineMid} />

				<rect x="100" y="22" width="4" height="8" fill={palette.pineDark} />
				<rect x="99" y="24" width="6" height="4" fill={palette.pineDark} />
			</g>

			{/* meadow shadow rows */}
			<g fill={palette.meadowShadow}>
				<rect y="38" width="120" height="2" />
				<rect y="46" width="120" height="2" />
			</g>
			<g fill={palette.meadowDeepRow}>
				<rect y="40" width="120" height="1" />
				<rect y="48" width="120" height="1" />
			</g>
			{/* deep grass foreground */}
			<rect y="50" width="120" height="4" fill={palette.deepGrass} />
			<g fill={palette.grassTuft}>
				<rect x="8" y="49" width="2" height="1" />
				<rect x="30" y="49" width="2" height="1" />
				<rect x="57" y="49" width="2" height="1" />
				<rect x="83" y="49" width="2" height="1" />
				<rect x="108" y="49" width="2" height="1" />
			</g>
		</svg>
	);
}
