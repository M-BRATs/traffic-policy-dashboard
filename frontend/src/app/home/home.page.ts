import { Component } from '@angular/core';
import wifiObjects from '../../data/wifi_objects.json';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  // google maps zoom level
  zoom = 10;
  hotspots = wifiObjects;

  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  constructor() {
  }

}
