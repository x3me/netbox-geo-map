
let map
function initMap() {

  const statusSelect = document.getElementById('statusSelect');
  const defaultStatus = 'all';
  let status = defaultStatus;

  statusSelect.addEventListener('change', function () {
    status = statusSelect.value;
    fetchDataAndCreateMap(status);
  });

  fetchDataAndCreateMap(status);
}

function fetchDataAndCreateMap(status) {
  fetch('/plugins/geo_map/api/sites')
    .then(response => response.json())
    .then(data => {

      const centerCoordinates = calculateCenter(data);
      const mapOptions = {
        center: centerCoordinates,
        zoom: 7,
      };
      map = new google.maps.Map(document.getElementById("map"), mapOptions);

      const pathsByStatus = {};

      data.forEach(site => {
        // let group = (site.group).toLowerCase()
        // console.log(site)
        if (status === 'all') {
          addMarker({
            location: site.position,
            // icon: `/assets/icons/${group}_${site.status}.png`,
            // icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
            content: '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
          });

          if (!pathsByStatus[site.status]) {
            pathsByStatus[site.status] = [];
          }
          pathsByStatus[site.status].push(site.position);
          // console.log(site)
        } else if (site.status === status) {
          addMarker({
            location: site.position,
            // icon: `/assets/icons/${group}_${site.status}.png`,
            //  icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
            content: '<h5>' + site.title + '</h5><p>Status: ' + site.status + '</p><p>Group: ' + site.group + '</p>',
          });

          if (!pathsByStatus[site.status]) {
            pathsByStatus[site.status] = [];
          }
          pathsByStatus[site.status].push(site.position);
        }
      });

      for (const status in pathsByStatus) {
        if (pathsByStatus.hasOwnProperty(status)) {
          const statusPaths = pathsByStatus[status];
          drawPolyline(statusPaths, status);
        }
      }
      if (status === 'all') {
        console.log('Loading......')
      } else {
        console.log('This is all the data whose status is', status)
        console.log('Loading......')
      }
    })
    .catch(error => {
      console.error('Error fetching site data:', error);
    });
}

function addMarker(data) {

  const image = {
    url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
    // This marker is 20 pixels wide by 32 pixels high.
    size: new google.maps.Size(14, 26),
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
  if (data.icon) {
    marker.setIcon(data.icon);
  }
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

function drawPolyline(path, status) {
  //console.log(path, status)
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