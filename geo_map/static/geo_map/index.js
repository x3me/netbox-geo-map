
let map
let allSites = [];
let allLinks = [];
const displayedPolylines = [];

const content = document.querySelector("#content")
const mapContainer = document.querySelector('#map');
function setMapHeight() {
  mapContainer.style.height = content.clientHeight + 'px';
}
setMapHeight();
window.addEventListener('resize', setMapHeight);

function initMap() {

  const tenantSelect = document.getElementById('tenantSelect');
  const linkStatusSelect = document.getElementById('fiberLinkStatus');
  const statusSelect = document.getElementById('statusSelect');
  const groupSelect = document.getElementById('groupSelect');

  let selectedTenants = [];
  let selectedLinkStatuses = [];
  let selectedStatuses = [];
  let selectedGroups = [];


  statusSelect.addEventListener('change', function () {
    selectedStatuses = Array.from(statusSelect.selectedOptions).map(option => option.value);
    fetchDataAndCreateMap(selectedStatuses, selectedGroups);
  });

  groupSelect.addEventListener('change', function () {
    selectedGroups = Array.from(groupSelect.selectedOptions).map(option => (option.value).toLowerCase());
    if (selectedGroups.length) {
      fetchDataAndCreateMap(selectedStatuses, selectedGroups);
    }
  });

  linkStatusSelect.addEventListener('change', function () {
    selectedLinkStatuses = Array.from(linkStatusSelect.selectedOptions).map(option => option.value);
    fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses);
  });

  tenantSelect.addEventListener('change', function () {
    selectedTenants = Array.from(tenantSelect.selectedOptions).map(option => option.value);
    if (selectedTenants.length) {
      fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses);

    }
  });

  document.getElementById('actions').addEventListener('click', function () {
    // fetch('your-api-endpoint')
    //     .then(response => response.json())
    //     .then(data => {
    //         const dataBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    //         const dataURL = URL.createObjectURL(dataBlob);
    //         const downloadLink = document.createElement('a');
    //         downloadLink.href = dataURL;
    //         downloadLink.download = 'data.json';
    //         downloadLink.click();
    //         URL.revokeObjectURL(dataURL);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching or exporting data:', error);
    //     });
    console.log('Export Pops KML');
  });
  fetchDataAndCreateMap(selectedStatuses, selectedGroups);
}

function combineData(linksArray, sitesArray, selectedLinkStatuses, selectedTenants) {
  clearDisplayedPolylines()
  const combinedData = {};
  if (linksArray.length && sitesArray.length) {
    linksArray.forEach(connection => {
      const { id, status, terminations, color } = connection;
      const connectedSites = terminations.map(termination => termination.site);
      const siteDetails = sitesArray.filter(site => connectedSites.includes(site.id));
      const combinedObject = {
        id,
        status,
        color,
        terminations: siteDetails,
      };
      combinedData[id] = combinedObject;
    });
    if (!selectedTenants.length || !selectedLinkStatuses.length) {
      console.log('No Chosen Vendor or Fiber Links Status!')
    } else if (selectedLinkStatuses.length && selectedTenants.length) {
      clearDisplayedPolylines()
      for (const id in combinedData) {
        if (combinedData.hasOwnProperty(id)) {
          const connection = combinedData[id];
          const { terminations } = connection;
          if (terminations.length > 1 && connection.status && selectedLinkStatuses.length && selectedLinkStatuses.includes(connection.status)) {
            drawPolyline(terminations, connection)
          }
          terminations.forEach(termination => {
            addMarker({
              location: { lat: termination.latitude, lng: termination.longitude },
              icon: `/static/geo_map/assets/icons/${termination.group}_${termination.status}.png`,
              content: generateSiteHTML(termination),
            });
          });
        }
      }
    }
  }
}

function fetchAndDrawPolylinesOnMap(selectedTenants, selectedLinkStatuses) {
  const tenantStatusParam = Array.isArray(selectedTenants) && selectedTenants.length > 0 ? `tenant__in=${selectedTenants.join(',')}` : false;
  const LINKS_API_CALL = tenantStatusParam ?
    `/api/plugins/geo_map/links/?${tenantStatusParam}` :
    '/api/plugins/geo_map/links/';
  fetch(LINKS_API_CALL)
    .then(response => response.json())
    .then(data => {
      allLinks = JSON.parse(JSON.stringify(data))
      combineData(allLinks, allSites, selectedLinkStatuses, selectedTenants);
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}
function fetchDataAndCreateMap(selectedStatuses, selectedGroups) {
  let group_params = selectedGroups.length ? `&?group__in=${selectedGroups.join(',')}` : ''
  const API_CALL = selectedStatuses.length ?
    `/api/plugins/geo_map/sites/?status__in=${selectedStatuses.join(',')}${group_params}`
    : `/api/plugins/geo_map/sites/`

  fetch(API_CALL)
    .then(response => response.json())
    .then(data => {
      allSites = JSON.parse(JSON.stringify(data))
      const centerCoordinates = calculateCenter(data);
      const mapOptions = {
        center: centerCoordinates,
        zoom: 7,
      };
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      if (!selectedStatuses.length && !selectedGroups.length) {
        data.forEach(site => {
          if (site.group === 'pit') {
            addMarker({
              location: { lat: site.latitude, lng: site.longitude },
              icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.png`,
              content: generateSiteHTML(site),
            });
          }
        })
      } else {
        data.forEach(site => {
          addMarker({
            location: { lat: site.latitude, lng: site.longitude },
            icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.png`,
            content: generateSiteHTML(site),
          });

        });
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}
function addMarker(data) {
  if (data.location.lat !== 0 && data.location.lng !== 0) {
    const image = {
      url: data.icon,
      scaledSize: new google.maps.Size(14, 14),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(7, 7),
    };
    const marker = new google.maps.Marker({
      position: data.location,
      map: map,
      icon: image,
    });
    if (data.content) {
      const infoWindow = new google.maps.InfoWindow({
        content: data.content
      });
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      }
      );
    }
  }
}
function generateSiteHTML(site) {
  return ("<a href=" + site.url + ">" + site.name + "</a>")
}
function drawPolyline(terminations, connection) {
  const lineSymbolPath = {
    'active': [{   //active - solid line
      icon: {
        path: 'M 0,1 0,-1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "1px",
    },],
    'planned': [{ //planned - dashed line
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "15px",
    },],
    'offline': [{   // offline - dotted line
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "10px",
    },],
    'provisioning': [{  //provisioning - longdash
      icon: {
        path: 'M 0,-5 0,5',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "30px",
    },],
    'deprovisioning': [{ //kind of dotdash version  -> //deprovisioning - dotdash
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "10px",
    },
    {
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "15px",
    },],
    'decommissioning': [{ //decommissioning - twodash
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "10px",
    },
    {
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 2,
        strokeColor: connection.color,
      },
      offset: "0",
      repeat: "15px",
    },],
  }
  let status;
  let paths = terminations.map(t => {
    if (t.latitude !== 0 && t.longitude !== 0) {
      addMarker({
        location: { lat: t.latitude, lng: t.longitude },
        icon: `/static/geo_map/assets/icons/${t.group}_${t.status}.png`,
        content: generateSiteHTML(t),
      });
      status = t.status;
    }
    return (t.latitude !== 0 && t.longitude !== 0) ? { lat: t.latitude, lng: t.longitude } : null
  })
  if (status && !paths.includes(null)) {
    const polyline = new google.maps.Polyline({
      path: paths,
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        ...lineSymbolPath[status]
      ],
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
function calculateCenter(data) {
  const totalSites = data.length;
  const sumLat = data.reduce((sum, site) => sum + site.latitude, 0);
  const sumLng = data.reduce((sum, site) => sum + site.longitude, 0);
  const averageLat = sumLat / totalSites;
  const averageLng = sumLng / totalSites;
  return { lat: averageLat, lng: averageLng };
}
window.initMap = initMap