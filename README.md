![image](https://user-images.githubusercontent.com/23716586/140752472-adece23f-e406-4f50-aa0e-c5f02b85cbb1.png)

[Winning submission](https://devpost.com/software/policydriver) for the **Google challenge** about safety and accessiblity of transportation in cities at the [Smart City Hack 2021](https://smart-city-hack.devpost.com/submissions/search?utf8=%E2%9C%93&filter%5Bwhich+challenge+did+you+participate+in%3F%5D%5B%5D=google).

# PolicyDriver
A platform that enables policy makers to leverage open data in their decision making.
Enjoy a working prototype of PolicyDriver by opening the [PolicyDriver web app](http://you-teach.me/) in Google Chrome.

## Inspiration
**Smart cities** require **smart policies**. With increasing population density, a wide variety of different modes of transportation and environmental concerns, a major challenge in city planning is shaping the future of transportation. In order to make smart decisions in this area, policy makers need to have a good overview of **traffic safety, air quality and accessibility** of their city. By leveraging **open data and intuitive visualization**, we provide this overview.

## What it does
**PolicyDriver** offers an **interactive dashboard** for the policy makers of Munich. Our dashboard includes different **map overlays** that provide insights into the the cities traffic safety, accessibility and much more.
Additionally, policy makers can look into the **details of traffic safety along certain routes** or at places of interest using our "Routes and Places" layer. We highlight historical accidents along the routes and compute a **safety score** for the route. This can for example be very helpful when assessing whether children have safe ways to school.
For our "Accessibility Layer" we compute how well different areas of the city are connected to the heart of the city and visualize it using an intuitive heat map.
We also provide layers that allow to check details about **accident statistics**, **air quality** in the city and **WiFi coverage**.

## How we built it
We built the dashboard using **Angular** in combination with Ionic. For the map and its overlays we leveraged the **Google Maps API**.  Any data pre-processing was done using **Python**.
For the design we kept Material Design principles in mind and aimed to give as much space for the most important part of our application: the enhanced maps.
We obtained data from multiple different sources:
a) We used **open data sets** such as a data set of labeled accidents in Germany.
b) We **crawled data** from websites (e.g., for the map of open WiFi hotspots in the city).
c) We **generated data** using the Google Maps Api (e.g., distance metrics for our accessibility score).

## How to run
```bash
cd frontend
npm install
npm run serve
```
