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
  private heatmapAcc: google.maps.visualization.HeatmapLayer = null;


  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  constructor() {

  }
  ngOnDestroy(): void {

  }
  ngOnInit(): void {

  }

  public onMapLoad(mapInstance: google.maps.Map) {
    var heatmapData = [];
    for (let entry of this.accessbility) {
      heatmapData.push({location: new google.maps.LatLng(entry.location[0], entry.location[1]), weight: 1-entry.intensity})
    }

    this.heatmapAcc = new google.maps.visualization.HeatmapLayer({
      map: mapInstance,
      data: heatmapData,
      radius: 50
    });
  }

}
