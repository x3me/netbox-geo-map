
let map
function initMap() {
  const statusSelect = document.getElementById('statusSelect');
  const groupSelect = document.getElementById('groupSelect');
  const defaultStatus = 'default';
  const defaultGroup = 'Pit';
  let status = defaultStatus;
  let group = defaultGroup;

  statusSelect.addEventListener('change', function () {
    status = statusSelect.value;
    fetchDataAndCreateMap(status, group);
  });

  groupSelect.addEventListener('change', function () {
    group = groupSelect.value;
    fetchDataAndCreateMap(status, group);
  });

  document.getElementById('actions').addEventListener('click', function() {
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

function fetchDataAndCreateMap(status, group) {
  fetch('/api/plugins/geo_map/sites')
    .then(response => response.json())
    .then(data => {
      const centerCoordinates = calculateCenter(data);
      const mapOptions = {
        center: centerCoordinates,
        zoom: 7,
      };
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      const pathsByStatus = {};
      // console.log(data)

      if (status === 'all' || status === 'default' && group === 'All') {
        // console.log(status, group)
        data.forEach(site => {
          addMarker({
            location: site.position,
            icon: site.icon.url,
            content: generateSiteHTML(site),
          });

          if (!pathsByStatus[site.status]) {
            pathsByStatus[site.status] = [];
          }
          pathsByStatus[site.status].push(site.position);
        });

      } else if (status === 'all' || status === 'default' && group !== 'All') {
        data.forEach(site => {
          if (site.group === group) {
            //console.log(site.group, group)
            addMarker({
              location: site.position,
              icon: site.icon.url,
              content: generateSiteHTML(site),
            });
          }
          if (!pathsByStatus[site.status]) {
            pathsByStatus[site.status] = [];
          }
          pathsByStatus[site.status].push(site.position);
        });
      } else if (status !== 'all' || status !== 'default') {
        if(group !== 'All'){
          data.forEach(site => {
            if (site.status === status && site.group === group) {
            console.log(site.status, site.group)
              addMarker({
                location: site.position,
                icon: site.icon.url,
                content: generateSiteHTML(site),
              });
  
              if (!pathsByStatus[site.status]) {
                pathsByStatus[site.status] = [];
              }
              pathsByStatus[site.status].push(site.position);
            }
          })
        }else{
          data.forEach(site => {
            if (site.status === status) {
              console.log(site.status, status)
              addMarker({
                location: site.position,
                icon: site.icon.url,
                content: generateSiteHTML(site),
              });
  
              if (!pathsByStatus[site.status]) {
                pathsByStatus[site.status] = [];
              }
              pathsByStatus[site.status].push(site.position);
            }
          })
        }
        
      }
    
      if (status !== 'default' && status !== 'all') {
        // for (const status in pathsByStatus) {
        //   if (pathsByStatus.hasOwnProperty(status)) {
        //     const statusPaths = pathsByStatus[status];
        //     drawPolyline(statusPaths, status);
        //   }
        // }
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}

function addMarker(data) {

  const image = {
    url: data.icon,
    scaledSize: new google.maps.Size(18,18),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 32),
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

function calculateCenter(data) {
  const totalSites = data.length;
  const sumLat = data.reduce((sum, site) => sum + site.position.lat, 0);
  const sumLng = data.reduce((sum, site) => sum + site.position.lng, 0);
  const averageLat = sumLat / totalSites;
  const averageLng = sumLng / totalSites;

  return { lat: averageLat, lng: averageLng };
}
function generateSiteHTML(site) {
  
  return ( "<h6>" + site.title + "</h6>" )

  // return (
  //     "<img  style='width:24px; height:24px' src='" + site.icon.url + "'/>" +
  //     "<h5>" + site.title + "</h5>" +
  //     "<p>Status: " + site.status + "</p>" +
  //     "<p>Group: " + site.group + "</p>"
  // );
}

function drawPolyline(path, status) {
  console.log(status, path)
  const lineSymbolPath = {
    'active': [{ /// 'M 0,1 0,-1', // repeat:1px   //active - solid line
      icon: {
        path: 'M 0,1 0,-1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: '#F7F700',
      },
      offset: "0",
      repeat: "1px",
    },],
    'planned': [{ //'M 0,-2 0,1', // repeat:15px //planned - dashed line
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: options.strokeColor,
      },
      offset: "0",
      repeat: "15px",
    },],
    'offline': [{ //'M 0,3 0,2', //repeat:10px  // offline - dotted line
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: options.strokeColor,
      },
      offset: "0",
      repeat: "10px",
    },],
    'provisioning': [{ //'M 0,-5 0,5', //repeat:30px    //provisioning - longdash
      icon: {
        path: 'M 0,-5 0,5',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: options.strokeColor,
      },
      offset: "0",
      repeat: "30px",
    },],
    'deprovisioning': [{ //kind of dotdash version  -> //deprovisioning - dotdash
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: options.strokeColor,
      },
      offset: "0",
      repeat: "10px",
    },
    {
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        // strokeColor: options.strokeColor,
      },
      offset: "0",
      repeat: "15px",
    },],
    'decommissioning': [{ //decommissioning - twodash 
      icon: {
        path: 'M 0,3 0,2',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        strokeColor: '#FF0000'
      },
      offset: "0",
      repeat: "10px",
    },
    {
      icon: {
        path: 'M 0,-2 0,1',
        strokeOpacity: 1,
        scale: 2,
        strokeWeight: 1,
        strokeColor: '#FF0000'
      },
      offset: "0",
      repeat: "15px",
    },],
  }


  const polyline = new google.maps.Polyline({
    path: path,
    geodesic: true,
    strokeOpacity: 0,
    icons: [
      ...lineSymbolPath[status]
    ],
  });

  polyline.setMap(map);
}
window.initMap = initMap