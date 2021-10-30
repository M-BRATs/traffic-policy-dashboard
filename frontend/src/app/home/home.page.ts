import { Component, OnDestroy, OnInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import wifiObjects from '../../data/wifi_objects.json';
import accessibility from '../../data/accessibility.json';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy{
  // google maps zoom level
  zoom = 11;
  hotspots = wifiObjects;
  accessibility = accessibility;
  colorAccessibility = '#219653';
  radiusAccessibility = '50';
  rectangleSet = [];
  // private heatmapAcc: google.maps.visualization.HeatmapLayer = null;
  // private map;


  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  selectedLayer = 'wifi';

  map: google.maps.Map;

  constructor() {

  }

  ngOnDestroy(): void {

  }
  ngOnInit(): void {
    // for (let i = 0; i < this.accessibility.length -1; ++i) {
    //   for (let k = 0; k < this.accessibility[i].length -1; ++k) {
    //     const upperLeft = this.accessibility[i][k];
    //     const upperRight = this.accessibility[i][k];
    //     const lowerLeft = this.accessibility[i+1][k];
    //     const lowerRight = this.accessibility[i][k];
    //     const intensityAVG = (upperLeft.intensity + upperRight.intensity + lowerLeft.intensity + lowerRight.intensity) / 4;
    //     const newRectangle = {
    //       strokeColor: '#FF0000',
    //       strokeOpacity: 0.8,
    //       strokeWeight: 2,
    //       fillColor: '#FF0000',
    //       fillOpacity: intensityAVG,
    //       bounds: {
    //         north: upperLeft.location[0],
    //         south: lowerLeft.location[0],
    //         east: lowerRight.location[1],
    //         west: lowerLeft.location[1]
    //       },
    //     };
    //     console.log(newRectangle);
    //     this.rectangleSet.push(newRectangle);
    //   }
    // }
    const loader = new Loader({
      apiKey: 'AIzaSyAF7D4-rsvOHRzDm-vbj9nLo5jFwW6BWD0',
      version: 'weekly',
    });

    loader.load().then(() => {
      this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: this.lat, lng: this.lng },
        zoom: this.zoom,
      });
    });
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

  get dataLoaded() {
    return this.hotspots != null && this.accessibility != null;
  }

  // toggleLayer(layer: string) {
  //   if (layer === 'wifi') {
  //     this.wifiLayerActive = !this.wifiLayerActive;
  //   } else if (layer === 'safety') {
  //     this.safetyLayerActive = !this.safetyLayerActive;
  //   } else if (layer === 'accessibility') {
  //     this.accessibilityLayerActive = !this.accessibilityLayerActive;
  //   }
  // }

  get wifiLayerActive() {
    return this.selectedLayer === 'wifi';
  };

  get safetyLayerActive() {
    return this.selectedLayer === 'safety';
  };

  get accessibilityLayerActive() {
    return this.selectedLayer === 'accessibility';
  };

  selectLayer($event) {
    this.selectedLayer = $event.target.value;
  }
}
