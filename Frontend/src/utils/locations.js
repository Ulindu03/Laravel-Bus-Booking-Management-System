import citiesData from './cities-by-district.json';

export const sriLankaLocations = Object.keys(citiesData).map(district => {
  let towns = [...citiesData[district].cities];
  
  if (district === "Colombo" && !towns.includes("Colombo")) {
    towns.push("Colombo");
  }

  return {
    district,
    towns: towns.sort()
  };
});
