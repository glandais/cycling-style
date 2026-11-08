const CARTO = 'ref/cyclosm-cartocss-style/symbols/openstreetmap-carto';
const VERSATILES = 'ref/versatiles-style/icons';

/** POI colours from palette.mss. */
const COLORS = {
	bicycle: '#ac39ac',
	rental: '#006ac3',
	parking: '#0000ce',
	lodging: '#004b00',
	water: '#3b029a',
	health: '#444444',
	common: '#666666',
	nature: '#284623',
	peak: '#d08f55',
};

/** Every icon of the sprite. All sources are CC0: see LICENSES.md. */
export const ICONS: { name: string; source: string; color: string }[] = [
	{ name: 'bicycle', source: `${VERSATILES}/maki/bicycle.svg`, color: COLORS.bicycle },
	{ name: 'bicycle_rental', source: `${VERSATILES}/maki/bicycle-share.svg`, color: COLORS.rental },
	{ name: 'bicycle_parking', source: `${CARTO}/amenity/parking.svg`, color: COLORS.parking },
	{ name: 'drinking_water', source: `${CARTO}/amenity/drinking_water_full.svg`, color: COLORS.water },
	{ name: 'toilets', source: `${VERSATILES}/unknown/restrooms.svg`, color: COLORS.health },
	{ name: 'camping', source: `${CARTO}/tourism/camping.svg`, color: COLORS.lodging },
	{ name: 'caravan', source: `${CARTO}/tourism/caravan_park.svg`, color: COLORS.lodging },
	{ name: 'chalet', source: `${CARTO}/tourism/chalet.svg`, color: COLORS.lodging },
	{ name: 'guest_house', source: `${CARTO}/tourism/guest_house.svg`, color: COLORS.lodging },
	{ name: 'hostel', source: `${CARTO}/tourism/hostel.svg`, color: COLORS.lodging },
	{ name: 'hotel', source: `${CARTO}/tourism/hotel.svg`, color: COLORS.lodging },
	{ name: 'motel', source: `${CARTO}/tourism/motel.svg`, color: COLORS.lodging },
	{ name: 'shelter', source: `${VERSATILES}/unknown/shelter.svg`, color: COLORS.common },
	{ name: 'picnic', source: `${CARTO}/tourism/picnic.svg`, color: COLORS.nature },
	{ name: 'viewpoint', source: `${CARTO}/tourism/viewpoint.svg`, color: COLORS.common },
	{ name: 'information', source: `${CARTO}/tourism/information.svg`, color: COLORS.rental },
	{ name: 'bench', source: `${CARTO}/amenity/bench.svg`, color: COLORS.common },
	{ name: 'supermarket', source: `${CARTO}/shop/supermarket.svg`, color: COLORS.common },
	{ name: 'convenience', source: `${CARTO}/shop/convenience.svg`, color: COLORS.common },
	{ name: 'bakery', source: `${CARTO}/shop/bakery.svg`, color: COLORS.common },
	{ name: 'greengrocer', source: `${CARTO}/shop/greengrocer.svg`, color: COLORS.common },
	{ name: 'restaurant', source: `${CARTO}/amenity/restaurant.svg`, color: COLORS.common },
	{ name: 'fast_food', source: `${CARTO}/amenity/fast_food.svg`, color: COLORS.common },
	{ name: 'cafe', source: `${VERSATILES}/maki/cafe.svg`, color: COLORS.common },
	{ name: 'bar', source: `${CARTO}/amenity/bar.svg`, color: COLORS.common },
	{ name: 'fuel', source: `${CARTO}/amenity/fuel.svg`, color: COLORS.common },
	{ name: 'pharmacy', source: `${CARTO}/amenity/pharmacy.svg`, color: COLORS.health },
	{ name: 'hospital', source: `${VERSATILES}/maki/hospital.svg`, color: COLORS.health },
	{ name: 'doctors', source: `${CARTO}/amenity/doctors.svg`, color: COLORS.health },
	{ name: 'peak', source: `${CARTO}/natural/peak.svg`, color: COLORS.peak },
];
