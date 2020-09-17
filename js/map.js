// Markers 
var college = [49.58462142944336, 3.0158369541168213]
//Map
var map = L.map('map').setView(college, 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:30
}).addTo(map);

//Marker + popup
var marker = L.marker(college).addTo(map);
marker.bindPopup('<a class="popup" href="https://www.youtube.com/watch?v=LAfY3GzAV9I" target="_BLANK">Clique ici</a>');