/**
 * CyclOSM colours, taken from ref/cyclosm-cartocss-style (palette.mss and road-colors.mss).
 * Values marked "derived" are the result of CartoCSS colour operations in the original.
 */
export const palette = {
	land: '#eee5dc',
	water: '#8ecbeb',
	glacier: '#ddecec',
	grass: '#c2debd',
	meadow: '#e2eecb',
	wooded: '#95bd84',
	heath: '#b2c068',
	scrub: '#c8d7ab',
	farmland: '#fbf0e3',
	cemetery: '#d6ded2',
	quarry: '#c5c3c3',
	sand: '#f5e9c6',
	residential: '#faf0e7', // derived: land * 1.05
	commercial: '#ded8dd',
	industrial: '#e4dcd3', // derived: land * 0.96
	building: '#e4dfdb',
	buildingOutline: '#cec5be', // derived: darken(building, 10%)
	amenityArea: '#e0e0e0',
	parking: '#eeeeee',
	military: '#ff5555',
	boundary: '#888888',
	rail: '#888888',
	label: '#222222',
	labelHalo: '#ffffff',
	labelSymbol: '#666666',
	labelWater: '#3a7ca5',
} as const;

/** Road and path colours from road-colors.mss. */
export const roadColors = {
	cycle: '#0000ce',
	mixedCycle: '#0060ff',
	path: '#007360',
	footway: '#7a5b36',
	track: '#114021',
	cycleTunnel: '#4f4fff', // derived: lighten(cycle, 25%)
	mixedCycleTunnel: '#4d90ff', // derived: lighten(mixedCycle, 15%)
	pathTunnel: '#00c0a0', // derived: lighten(path, 15%)
	footwayTunnel: '#dcc3a6',
	noBicycle: '#d4d4d4',
	motorway: '#d4d4d4',
	motorwayCycle: '#f4c3c3',
	motorwayCase: '#f6f6f6',
	primary: '#f4dfc3',
	primaryCase: '#d8b267',
	secondary: '#f6f8d2',
	secondaryCase: '#b1bb5d',
	standard: '#f6f6f6',
	standardCase: '#888888',
	tertiaryCase: '#777777',
	pedestrianCase: '#bbbbbb',
	// CyclOSM colours these by maxspeed, which Shortbread lacks; the implied speed is used instead.
	livingStreet: '#bbffba',
	pedestrian: '#ddffba',
	noMotor: '#62ff96',
	bridgeCase: '#666666',
	pedestrianArea: '#dce3e0',
	cycleSurface: '#000068', // derived: darken(cycle, 20%)
	roadSurfaceRough: '#c3c3c3',
	roadSurfaceBad: '#dcdcdc',
} as const;

/** Colour overrides passed to `osm({ colors })`; keys are documented by `osm.colorKeys`. */
export const osmColors = {
	background: palette.land,
	land: palette.land,
	water: palette.water,
	glacier: palette.glacier,
	natureWood: palette.wooded,
	natureGrass: palette.grass,
	naturePark: palette.grass,
	natureAgriculture: palette.farmland,
	natureSand: palette.sand,
	natureRock: palette.quarry,
	natureWetland: palette.meadow,
	natureLeisure: palette.grass,
	areaResidential: palette.residential,
	areaCommercial: palette.commercial,
	areaIndustrial: palette.industrial,
	areaWaste: palette.quarry,
	areaBurial: palette.cemetery,
	siteConstruction: palette.quarry,
	siteEducation: palette.amenityArea,
	siteHospital: palette.amenityArea,
	siteDanger: palette.military,
	sitePrison: palette.amenityArea,
	siteParking: palette.parking,
	siteSports: palette.amenityArea,
	building: palette.building,
	buildingBg: palette.buildingOutline,
	transitRail: palette.rail,
	boundary: palette.boundary,
	label: palette.label,
	labelHalo: palette.labelHalo,
	labelSymbol: palette.labelSymbol,
	labelPoi: palette.labelSymbol,
	labelHousenumber: palette.labelSymbol,
	labelWater: palette.labelWater,
};
