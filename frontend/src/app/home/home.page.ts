import { Component, OnDestroy, OnInit } from '@angular/core';
import wifiObjects from '../../data/wifi_objects.json';
import accessbilityObjects from '../../data/accessibility.json';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy{
  // google maps zoom level
  zoom = 11;
  hotspots = wifiObjects;
  accessbility = accessbilityObjects
  colorAccessibility = "#219653";
  radiusAccessibility = "50";
  rectangleSet = [];
  // private heatmapAcc: google.maps.visualization.HeatmapLayer = null;
  // private map;


  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  constructor() {

  }
  ngOnDestroy(): void {

  }
  ngOnInit(): void {
    for (let i = 0; i < accessbilityObjects.length -1; ++i) {
      for (let k = 0; k < accessbilityObjects[i].length -1; ++k) {
        const upperLeft = accessbilityObjects[i][k];
        const upperRight = accessbilityObjects[i][k];
        const lowerLeft = accessbilityObjects[i+1][k];
        const lowerRight = accessbilityObjects[i][k];
        let intensityAVG = (upperLeft.intensity + upperRight.intensity + lowerLeft.intensity + lowerRight.intensity) / 4;
        let newRectangle = {
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: intensityAVG,
          bounds: {
            north: upperLeft.location[0],
            south: lowerLeft.location[0],
            east: lowerRight.location[1],
            west: lowerLeft.location[1]
          },
        }
        console.log(newRectangle)
        this.rectangleSet.push(newRectangle);
      }
    }
  }

  // public onMapLoad(mapInstance: google.maps.Map) {
  //   this.map = mapInstance;
  //   var heatmapData = [];
  //   for (let entry of this.accessbility) {
  //     heatmapData.push({location: new google.maps.LatLng(entry.location[0], entry.location[1]), weight: 1-entry.intensity})
  //   }

  //   this.heatmapAcc = new google.maps.visualization.HeatmapLayer({
  //     map: mapInstance,
  //     data: heatmapData,
  //     radius: 20
  //   });

  //   google.maps.event.addListener(mapInstance, 'zoom_changed', function () {
  //     this.heatmap.setOptions({radius: Math.floor(100*10)});
  //   });
  // }

}
