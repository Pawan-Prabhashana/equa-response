/**
 * Sri Lanka Districts - GeoJSON Data
 * Simplified district boundaries for geospatial analysis
 */

export interface DistrictFeature {
  type: 'Feature';
  properties: {
    name: string;
    code: string;
    province: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface DistrictsGeoJSON {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

const districtsGeoJSON: DistrictsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Kalutara",
        code: "KT",
        province: "Western"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.85, 6.70],
          [80.20, 6.70],
          [80.20, 6.45],
          [80.05, 6.30],
          [79.85, 6.35],
          [79.85, 6.70]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Colombo",
        code: "CO",
        province: "Western"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.78, 6.95],
          [79.95, 6.95],
          [79.95, 6.80],
          [79.78, 6.80],
          [79.78, 6.95]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Gampaha",
        code: "GP",
        province: "Western"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [79.85, 7.15],
          [80.15, 7.15],
          [80.15, 6.90],
          [79.85, 6.90],
          [79.85, 7.15]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Galle",
        code: "GL",
        province: "Southern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.05, 6.25],
          [80.35, 6.25],
          [80.35, 5.95],
          [80.05, 5.95],
          [80.05, 6.25]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Matara",
        code: "MT",
        province: "Southern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.35, 6.15],
          [80.75, 6.15],
          [80.75, 5.85],
          [80.35, 5.85],
          [80.35, 6.15]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ratnapura",
        code: "RP",
        province: "Sabaragamuwa"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.20, 6.85],
          [80.65, 6.85],
          [80.65, 6.35],
          [80.20, 6.35],
          [80.20, 6.85]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Kandy",
        code: "KY",
        province: "Central"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.50, 7.50],
          [80.95, 7.50],
          [80.95, 7.05],
          [80.50, 7.05],
          [80.50, 7.50]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Nuwara Eliya",
        code: "NE",
        province: "Central"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.65, 7.15],
          [81.05, 7.15],
          [81.05, 6.75],
          [80.65, 6.75],
          [80.65, 7.15]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Badulla",
        code: "BD",
        province: "Uva"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.95, 7.15],
          [81.35, 7.15],
          [81.35, 6.70],
          [80.95, 6.70],
          [80.95, 7.15]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Trincomalee",
        code: "TR",
        province: "Eastern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.95, 8.95],
          [81.45, 8.95],
          [81.45, 8.35],
          [80.95, 8.35],
          [80.95, 8.95]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Batticaloa",
        code: "BC",
        province: "Eastern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [81.25, 8.15],
          [81.75, 8.15],
          [81.75, 7.55],
          [81.25, 7.55],
          [81.25, 8.15]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Ampara",
        code: "AP",
        province: "Eastern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [81.35, 7.45],
          [81.85, 7.45],
          [81.85, 6.90],
          [81.35, 6.90],
          [81.35, 7.45]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Hambantota",
        code: "HB",
        province: "Southern"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.75, 6.45],
          [81.35, 6.45],
          [81.35, 5.95],
          [80.75, 5.95],
          [80.75, 6.45]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Kegalle",
        code: "KG",
        province: "Sabaragamuwa"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.15, 7.35],
          [80.55, 7.35],
          [80.55, 6.90],
          [80.15, 6.90],
          [80.15, 7.35]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Matale",
        code: "ML",
        province: "Central"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.55, 7.85],
          [80.95, 7.85],
          [80.95, 7.40],
          [80.55, 7.40],
          [80.55, 7.85]
        ]]
      }
    }
  ]
};

export default districtsGeoJSON;
