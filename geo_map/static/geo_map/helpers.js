function generateSiteHTML(site) {
  return (
    "<a target='_blank' style='color:black;' href=" +
    site.url +
    ">" +
    site.name +
    "</a>"
  );
}

function drawPolyline(terminations, connection) {
  const lineSymbolPath = {
    active: [
      {
        //solid line
        icon: {
          path: "M 0,1 0,-1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "1px",
      },
    ],
    planned: [
      {
        //dashed line
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
    ],
    offline: [
      {
        //dotted line
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "10px",
      },
    ],
    provisioning: [
      {
        //longdash
        icon: {
          path: "M 0,-5 0,5",
          strokeOpacity: 1,
          scale: 1,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "30px",
      },
    ],
    decommissioned: [
      {
        //twodash
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
      {
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "15px",
      },
    ],
    deprovisioning: [
      {
        //dotdash
        icon: {
          path: "M 0,3 0,2",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "10px",
      },
      {
        icon: {
          path: "M 0,-2 0,1",
          strokeOpacity: 1,
          scale: 2,
          strokeWeight: 3,
          strokeColor: connection.color,
        },
        offset: "0",
        repeat: "20px",
      },
    ],
  };
  const paths = terminations.map((t) => {
    if (t.latitude === 0 || t.longitude === 0) return null;
    return { lat: t.latitude, lng: t.longitude };
  });
  if (connection.status && !paths.includes(null)) {
    const polyline = new google.maps.Polyline({
      path: paths,
      geodesic: true,
      strokeOpacity: 0,
      icons: [...lineSymbolPath[connection.status]],
    });
    polyline.setMap(map);
    displayedPolylines.push(polyline);
  }
}

function clearDisplayedPolylines() {
  for (const polyline of displayedPolylines) {
    polyline.setMap(null);
  }
  displayedPolylines.length = 0;
}

function clearDisplayedMarkers() {
  displayedMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  displayedMarkers = [];
}

function calculateCenter(data) {
  const totalSites = data.length;
  const sumLat = data.reduce((sum, site) => sum + site.latitude, 0);
  const sumLng = data.reduce((sum, site) => sum + site.longitude, 0);
  const averageLat = sumLat / totalSites;
  const averageLng = sumLng / totalSites;

  if (isNaN(averageLat) || isNaN(averageLng)) {
    return { lat: 23.5, lng: 78.6677428 };
  }
  return { lat: averageLat, lng: averageLng };
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function calculateCenterBetweenSites(sites) {
  const validSites = sites.filter(site => site.lat && site.lng);

  validSites.sort((a, b) => {
    if (a.lat === b.lat) {
      return a.lng - b.lng;
    }
    return a.lat - b.lat;
  });

  if (validSites.length === 0) {
    return null;
  }

  if (validSites.length === 1) {
    return { lat: validSites[0].lat, lng: validSites[0].lng };
  }

  let centerLat
  let centerLng
  if (validSites.length > 10) {
    centerLat = validSites.reduce((acc, site) => acc + site.lat, 0) / validSites.length;
    centerLng = validSites.reduce((acc, site) => acc + site.lng, 0) / validSites.length;
  } else {
    const firstSite = validSites[0];
    const secondSite = validSites[1];
    centerLat = (firstSite.lat + secondSite.lat) / 2;
    centerLng = (firstSite.lng + secondSite.lng) / 2;
  }

  return { lat: centerLat, lng: centerLng };
}


