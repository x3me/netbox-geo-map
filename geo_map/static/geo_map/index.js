let map
function initMap() {
    // let options = {
    //   zoom: 8,
    //   center: { lat: 37.7749, lng: -122.4194 },
    // };
    
     map = new google.maps.Map(document.getElementById("map"));
 
    console.log('Hello Eva from index.js')
    let markersArray = [
      {location: { lat: 37.7749, lng: -122.4194 }, icon: './static/geo_map/assets/icons/access_active.png', content: '<h1>San Francisco</h1>'},
      {location: { lat: 37.3382, lng: -121.8863 }, icon: './static/geo_map/assets/icons/core_active.png', content: '<h1>San Jose</h1>'},
      {location: { lat: 37.6879, lng: -122.4702 }, icon: './static/geo_map/assets/icons/distribution_active.png', content: '<h1>San Bruno</h1>'},
      {location: { lat: 37.3541, lng: -121.9552 }, icon: './static/geo_map/assets/icons/fiberpit_active.png', content: '<h1>Santa Clara</h1>'},
      {location: { lat: 37.3861, lng: -122.0839 }, icon: './static/geo_map/assets/icons/core_planned.png', content: '<h1>Palo Alto</h1>'},
      {location: { lat: 37.4849, lng: -122.2281 }, icon: './static/geo_map/assets/icons/access_staging.png', content: '<h1>Redwood City</h1>'},
    ];

    for(let i = 0; i < markersArray.length; i++){
      addMarker(markersArray[i]);
    }    
    function addMarker(data){
      const marker = new google.maps.Marker({
        position: data.location,
        map: map,
        //icon: data.icon
      });
      if(data.icon){
        marker.setIcon(data.icon);
      }
      if(data.content){
        const infoWindow = new google.maps.InfoWindow({
          content: data.content
        });
        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker);
        }
        );
      }
    }
    //addMarker({location: { lat: 37.7749, lng: -122.4194 }, icon: './static/geo_map/assets/icons/access_active.png', content: '<h1>San Francisco</h1>'});
  }
  window.initMap = initMap
  