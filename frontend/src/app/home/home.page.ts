import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  // google maps zoom level
  zoom = 10;

  // initial center position for the map
  lat = 48.1351;
  lng = 11.5820;

  constructor() {}

}
