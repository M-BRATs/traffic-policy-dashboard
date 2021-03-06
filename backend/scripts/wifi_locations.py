import urllib.request
from bs4 import BeautifulSoup
from geopy import Nominatim
from functional import seq
from pathlib import Path
import json

PATH_TO_SCRIPTS = Path(__file__).parent
PATH_TO_COORDINATES = (PATH_TO_SCRIPTS / "../data/wifi.json").resolve()


def scrape_wifi_hotspots():
    coordinates = []
    for i in range(1, 4):
        data = urllib.request.urlopen("https://www.muenchen.de/leben/wlan-hotspot_{}.html".format(i)).read()
        soup = BeautifulSoup(data, 'html.parser')
        streets = seq(soup.find_all('span', class_='item__url item__url--address str')) \
            .map(lambda street: street.decode_contents()) \
            .list()
        zip_codes = seq(soup.find_all('span', class_='item__url item__url--address zip')) \
            .map(lambda zip_code: zip_code.decode_contents()) \
            .list()
        next_coordinates = (seq(zip(streets, zip_codes))
                            .map(lambda addr_tuple: coordinates_from_address(addr_tuple[0] + ' ' + addr_tuple[1]))
                            .filter(lambda coords: coords is not None)
                            .list())
        coordinates.extend(next_coordinates)
    return coordinates


def coordinates_from_address(address):
    geolocator = Nominatim(user_agent="M-Brats")
    location = geolocator.geocode(address)
    if location is None:
        print("Unknown address: " + address)
    else:
        return [location.latitude, location.longitude]


def get_coordinates():
    with open(PATH_TO_COORDINATES) as json_file:
        coordinates = json.load(json_file)


# run script
if __name__ == '__main__':
    # get_coordinates()
    wifi_hotspots = scrape_wifi_hotspots()
    wifi_hotspots = list(map(lambda h: {'lat': h[0], 'lng': h[1]}, wifi_hotspots))
    with open(PATH_TO_COORDINATES, 'w') as json_file:
        json.dump(wifi_hotspots, json_file)
