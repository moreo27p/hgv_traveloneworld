import type { OsmPoi } from "@/lib/overpass";

type AttractionRow = {
  test: RegExp;
  items: { name: string; type: string }[];
};

const FALLBACKS: AttractionRow[] = [
  {
    test: /park city|deer valley/i,
    items: [
      { name: "Historic Main Street", type: "Attraction" },
      { name: "Utah Olympic Park", type: "Museum" },
      { name: "Park City Mountain Village", type: "Attraction" },
      { name: "Deer Valley Resort", type: "Ski" },
    ],
  },
  {
    test: /orlando|kissimmee|winter garden/i,
    items: [
      { name: "Walt Disney World Resort", type: "Theme park" },
      { name: "Universal Orlando Resort", type: "Theme park" },
      { name: "Disney Springs", type: "Attraction" },
      { name: "SeaWorld Orlando", type: "Theme park" },
    ],
  },
  {
    test: /las vegas/i,
    items: [
      { name: "The Strip", type: "Attraction" },
      { name: "Bellagio Conservatory & Fountains", type: "Attraction" },
      { name: "Red Rock Canyon", type: "Park" },
      { name: "The Sphere", type: "Attraction" },
    ],
  },
  {
    test: /honolulu|waikiki/i,
    items: [
      { name: "Waikiki Beach", type: "Beach" },
      { name: "Diamond Head", type: "Park" },
      { name: "Pearl Harbor", type: "Historic" },
      { name: "Ala Moana Center", type: "Attraction" },
    ],
  },
  {
    test: /maui|lahaina|kaanapali|kihei/i,
    items: [
      { name: "Ka'anapali Beach", type: "Beach" },
      { name: "Road to Hana", type: "Attraction" },
      { name: "Haleakala National Park", type: "Park" },
      { name: "Lahaina Harbor", type: "Attraction" },
    ],
  },
  {
    test: /waikoloa|kona|kohala/i,
    items: [
      { name: "Hapuna Beach State Recreation Area", type: "Beach" },
      { name: "Pu'uhonua o Honaunau National Historical Park", type: "Historic" },
      { name: "Kailua-Kona", type: "Attraction" },
      { name: "Mauna Kea Visitor Information Station", type: "Viewpoint" },
    ],
  },
  {
    test: /new york|manhattan/i,
    items: [
      { name: "Central Park", type: "Park" },
      { name: "Times Square", type: "Attraction" },
      { name: "The Metropolitan Museum of Art", type: "Museum" },
      { name: "Top of the Rock", type: "Viewpoint" },
    ],
  },
  {
    test: /myrtle beach/i,
    items: [
      { name: "Myrtle Beach Boardwalk", type: "Attraction" },
      { name: "Broadway at the Beach", type: "Attraction" },
      { name: "Brookgreen Gardens", type: "Park" },
      { name: "SkyWheel Myrtle Beach", type: "Viewpoint" },
    ],
  },
  {
    test: /whistler/i,
    items: [
      { name: "Whistler Blackcomb", type: "Ski" },
      { name: "Peak 2 Peak Gondola", type: "Viewpoint" },
      { name: "Whistler Village", type: "Attraction" },
      { name: "Lost Lake Park", type: "Park" },
    ],
  },
  {
    test: /breckenridge/i,
    items: [
      { name: "Breckenridge Ski Resort", type: "Ski" },
      { name: "Main Street Breckenridge", type: "Attraction" },
      { name: "Boreas Pass Road", type: "Viewpoint" },
      { name: "Country Boy Mine", type: "Historic" },
    ],
  },
  {
    test: /vail/i,
    items: [
      { name: "Vail Ski Resort", type: "Ski" },
      { name: "Vail Village", type: "Attraction" },
      { name: "Betty Ford Alpine Gardens", type: "Park" },
      { name: "Gondola One", type: "Viewpoint" },
    ],
  },
  {
    test: /aspen/i,
    items: [
      { name: "Aspen Snowmass", type: "Ski" },
      { name: "Maroon Bells", type: "Viewpoint" },
      { name: "Aspen Art Museum", type: "Museum" },
      { name: "Downtown Aspen", type: "Attraction" },
    ],
  },
  {
    test: /tahoe/i,
    items: [
      { name: "Lake Tahoe", type: "Attraction" },
      { name: "Heavenly Village", type: "Attraction" },
      { name: "Emerald Bay State Park", type: "Park" },
      { name: "Palisades Tahoe", type: "Ski" },
    ],
  },
];

export function fallbackAttractionsForText(text: string, lat: number, lon: number): OsmPoi[] {
  const match = FALLBACKS.find((row) => row.test.test(text));
  if (!match) return [];

  return match.items.map((item, index) => ({
    ...item,
    lat: lat + index * 0.001,
    lon: lon + index * 0.001,
  }));
}
