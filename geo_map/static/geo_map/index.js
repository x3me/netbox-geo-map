
let map
let allSites = [];
let allLinks = [];
const displayedPolylines = [];
setMapHeight();
window.addEventListener('resize', setMapHeight);

function initMap() {
  const statusSelect = document.getElementById('statusSelect');
  const groupSelect = document.getElementById('groupSelect');
  const linkStatusSelect = document.getElementById('fiberLinkStatus');
  const tenantSelect = document.getElementById('tenantSelect');
  const defaultStatus = 'default';
  const defaultGroup = 'pit';
  let status = defaultStatus;
  let group = defaultGroup;
  let linkStatus = 'all';
  let tenantStatus = 'all';

  statusSelect.addEventListener('change', function () {
    status = statusSelect.value
    fetchDataAndCreateMap(status, group);
  });

  groupSelect.addEventListener('change', function () {
    group = (groupSelect.value).toLowerCase()
    fetchDataAndCreateMap(status, group);
  });

  linkStatusSelect.addEventListener('change', function () {
    linkStatus = linkStatusSelect.value
    clearDisplayedPolylines();
    fetchAndDrawPolylinesOnMap(linkStatus, tenantStatus);
    combineData(allLinks, allSites, linkStatus);
  });

  tenantSelect.addEventListener('change', function () {
    clearDisplayedPolylines();
    tenantStatus = tenantSelect.value
    fetchAndDrawPolylinesOnMap(linkStatus, tenantStatus)
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
  fetchDataAndCreateMap(status, group);
}

function combineData(linksArray, sitesArray, linkStatus) {
  const combinedData = {};
  console.log(linksArray, sitesArray)
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
    console.log(combinedData)

    for (const id in combinedData) {
      if (combinedData.hasOwnProperty(id)) {
        const connection = combinedData[id];
        const { terminations } = connection;
        if (terminations.length > 1 && connection.status && connection.status === linkStatus) {
          drawPolyline(terminations, connection)
        } else if (terminations.length > 1 && linkStatus === 'all') {
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

function fetchAndDrawPolylinesOnMap(linkStatus, tenantStatus) {
  console.log(tenantStatus)
  const LINKS_API_CALL = tenantStatus === 'all' ?
                            '/api/plugins/geo_map/links/' : `/api/plugins/geo_map/links/?tenant=${tenantStatus}`
  fetch(LINKS_API_CALL)
    .then(response => response.json())
    .then(data => {
      console.log(data)
      allLinks = JSON.parse(JSON.stringify(data))
      combineData(allLinks, allSites, linkStatus);
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}


function fetchDataAndCreateMap(status, group) {
  const API_CALL = status !== 'default' && status !== 'all' ?
    `/api/plugins/geo_map/sites/?status=${status}` :
    `/api/plugins/geo_map/sites/`
  fetch(API_CALL)
    .then(response => response.json())
    .then(data => {
      allSites = JSON.parse(JSON.stringify(data))
      const centerCoordinates = calculateCenter(data);
      const mapOptions = {
        center: centerCoordinates,
        zoom: 7,
      };
      if (group !== 'all') {
        map = new google.maps.Map(document.getElementById("map"), mapOptions);
        data.forEach(site => {
          if (site.group === group || site.group === 'pit') {
            addMarker({
              location: { lat: site.latitude, lng: site.longitude },
              icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.png`,
              content: generateSiteHTML(site),
            });
          }
        });
      } else {
        map = new google.maps.Map(document.getElementById("map"), mapOptions);
        data.forEach(site => {
          addMarker({
            location: { lat: site.latitude, lng: site.longitude },
            icon: `/static/geo_map/assets/icons/${site.group}_${site.status}.png`,
            content: generateSiteHTML(site),
          });
        })
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}


function addMarker(data) {
  if(data.location.lat !== 0 && data.location.lng !== 0){
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
   
    if(t.latitude !== 0 && t.longitude !== 0){
      addMarker({
        location: { lat: t.latitude, lng: t.longitude },
        icon: `/static/geo_map/assets/icons/${t.group}_${t.status}.png`,
        content: generateSiteHTML(t),
      });
      status = t.status;
    }
    return (t.latitude !== 0 && t.longitude !== 0) ?  { lat: t.latitude, lng: t.longitude } : null
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

function setMapHeight() {
  const mapContainer = document.getElementById('map');
  mapContainer.style.height = `${window.innerHeight - 280}px`;
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