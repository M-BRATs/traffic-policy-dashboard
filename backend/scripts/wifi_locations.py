import urllib.request
from bs4 import BeautifulSoup
from geopy import Nominatim
import json

PATH_TO_COORDINATES = '../data/wifi.json'


def scrape_wifi_hotspots():
    for i in range(1, 10):
        data = urllib.request.urlopen("https://www.muenchen.de/leben/wlan-hotspot_{}.html".format(i)).read()
        soup = BeautifulSoup(data)
        streets = list(map(lambda street: street.decode_contents(),
                           soup.find_all('span', class_='item__url item__url--address str')))

        zip_codes = list(map(lambda addr_zip: addr_zip.decode_contents(),
                             soup.find_all('span', class_='item__url item__url--address zip')))

        coordinates = list(map(lambda addr_tuple: coordinates_from_address(addr_tuple[0] + ' ' + addr_tuple[1]),
                             zip(streets, zip_codes)))
        return coordinates

def coordinates_from_address(address):
    geolocator = Nominatim(user_agent="M-Brats")
    location = geolocator.geocode(address)
    coordinates = [location.latitude, location.longitude]
    with open(PATH_TO_COORDINATES, 'w') as json_file:
        json.dump(coordinates, json_file)
    return coordinates


def get_coordinates():
    with open(PATH_TO_COORDINATES) as json_file:
        coordinates = json.load(json_file)
    return coordinates

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    wifi_hotspots = scrape_wifi_hotspots()
    for addr in wifi_hotspots:
        coordinates_from_address(addr)
