const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#07373c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#292929' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: 'rgb(243, 229, 229)' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];
let darkmode=localStorage.getItem('darkmode')
const themeSwitch=document.getElementById('theme-switch')

const enableDarkmode=()=>{
  document.body.classList.add('darkmode')
  localStorage.setItem('darkmode','active')
  if(map){
      map.setOptions({styles:darkMapStyle})
  }
};

const disableDarkmode=()=>{
  document.body.classList.remove('darkmode')
  localStorage.setItem('darkmode','null')
  if(map){
      map.setOptions({styles:[]})
  }
}

if(darkmode==='active') enableDarkmode()

themeSwitch.addEventListener('click',()=>{
  darkmode=localStorage.getItem('darkmode')
  darkmode!=="active"?enableDarkmode():disableDarkmode()
})