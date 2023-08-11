
let map
function initMap() {
  const statusSelect = document.getElementById('statusSelect');
  const groupSelect = document.getElementById('groupSelect');
  const defaultStatus = 'default';
  const defaultGroup = 'All';
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
            content: '<img src=' + site.icon.url + '/>' + '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
          });

          if (!pathsByStatus[site.status]) {
            pathsByStatus[site.status] = [];
          }
          pathsByStatus[site.status].push(site.position);
        });

      } else if (status === 'all' || status === 'default' && group !== 'All') {
        data.forEach(site => {
          if (site.group === group) {
            addMarker({
              location: site.position,
              icon: site.icon.url,
              content: '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
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
            
              addMarker({
                location: site.position,
                icon: site.icon.url,
                content: '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
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
              addMarker({
                location: site.position,
                icon: site.icon.url,
                content: '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
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
        if (status === 'all') {
          console.log('Loading......')
        } else {
          console.log('This is all the data whose status is', status)
          console.log('Loading......')
        }
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}

function addMarker(data) {

  const image = {
    url: data.icon,
    // This marker is 20 pixels wide by 32 pixels high.
    // size: new google.maps.Size(20,32),
    // The origin for this image is (0, 0).
    origin: new google.maps.Point(0, 0),
    // The anchor for this image is the base of the flagpole at (0, 32).
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
  //
// new google.maps.Marker({
//   position: { lat: 36.6163, lng: -100.61 },
//   map,
//   icon: {
//     path: faBus.icon[4],
//     fillColor: "#0000ff",
//     fillOpacity: 1,
//     anchor: new google.maps.Point(
//       faBus.icon[0] / 2, // width
//       faBus.icon[1], // height
//     ),
//     strokeWeight: 1,
//     strokeColor: "#ffffff",
//     scale: 0.075,
//   },
//   title: "FontAwesome SVG Marker",
// });
//
}

function calculateCenter(data) {
  const totalSites = data.length;
  const sumLat = data.reduce((sum, site) => sum + site.position.lat, 0);
  const sumLng = data.reduce((sum, site) => sum + site.position.lng, 0);
  const averageLat = sumLat / totalSites;
  const averageLng = sumLng / totalSites;

  return { lat: averageLat, lng: averageLng };
}

function drawPolyline(path, status) {

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