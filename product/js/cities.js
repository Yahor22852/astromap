/* cities.js — города с координатами и правилами перехода на летнее время.
   Скопировано из воронки, чтобы продукт и воронка считали одинаково.
   tz — базовое смещение без DST; dst — правило ('eu' | 'us' | 'south' | ''). */
(function (g) {
  'use strict';

var CITIES_PL = [
    { n: 'Warszawa',       lat: 52.23, lon: 21.01, tz: 1, dst: 'eu' },
    { n: 'Kraków',         lat: 50.06, lon: 19.94, tz: 1, dst: 'eu' },
    { n: 'Łódź',           lat: 51.76, lon: 19.46, tz: 1, dst: 'eu' },
    { n: 'Wrocław',        lat: 51.11, lon: 17.04, tz: 1, dst: 'eu' },
    { n: 'Poznań',         lat: 52.41, lon: 16.93, tz: 1, dst: 'eu' },
    { n: 'Gdańsk',         lat: 54.35, lon: 18.65, tz: 1, dst: 'eu' },
    { n: 'Gdynia',         lat: 54.52, lon: 18.53, tz: 1, dst: 'eu' },
    { n: 'Szczecin',       lat: 53.43, lon: 14.55, tz: 1, dst: 'eu' },
    { n: 'Bydgoszcz',      lat: 53.12, lon: 18.01, tz: 1, dst: 'eu' },
    { n: 'Lublin',         lat: 51.25, lon: 22.57, tz: 1, dst: 'eu' },
    { n: 'Białystok',      lat: 53.13, lon: 23.16, tz: 1, dst: 'eu' },
    { n: 'Katowice',       lat: 50.26, lon: 19.02, tz: 1, dst: 'eu' },
    { n: 'Gliwice',        lat: 50.29, lon: 18.67, tz: 1, dst: 'eu' },
    { n: 'Zabrze',         lat: 50.32, lon: 18.79, tz: 1, dst: 'eu' },
    { n: 'Sosnowiec',      lat: 50.28, lon: 19.13, tz: 1, dst: 'eu' },
    { n: 'Częstochowa',    lat: 50.81, lon: 19.12, tz: 1, dst: 'eu' },
    { n: 'Radom',          lat: 51.40, lon: 21.15, tz: 1, dst: 'eu' },
    { n: 'Toruń',          lat: 53.01, lon: 18.60, tz: 1, dst: 'eu' },
    { n: 'Kielce',         lat: 50.87, lon: 20.63, tz: 1, dst: 'eu' },
    { n: 'Rzeszów',        lat: 50.04, lon: 22.00, tz: 1, dst: 'eu' },
    { n: 'Olsztyn',        lat: 53.78, lon: 20.49, tz: 1, dst: 'eu' },
    { n: 'Zielona Góra',   lat: 51.94, lon: 15.51, tz: 1, dst: 'eu' },
    { n: 'Opole',          lat: 50.67, lon: 17.93, tz: 1, dst: 'eu' },
    { n: 'Rybnik',         lat: 50.09, lon: 18.55, tz: 1, dst: 'eu' },
    { n: 'Tychy',          lat: 50.13, lon: 18.99, tz: 1, dst: 'eu' },
    { n: 'Bielsko-Biała',  lat: 49.82, lon: 19.04, tz: 1, dst: 'eu' },
    { n: 'Płock',          lat: 52.55, lon: 19.71, tz: 1, dst: 'eu' },
    { n: 'Elbląg',         lat: 54.16, lon: 19.40, tz: 1, dst: 'eu' },
    { n: 'Koszalin',       lat: 54.19, lon: 16.18, tz: 1, dst: 'eu' },
    { n: 'Legnica',        lat: 51.21, lon: 16.16, tz: 1, dst: 'eu' },
    { n: 'Nowy Sącz',      lat: 49.62, lon: 20.70, tz: 1, dst: 'eu' },
    { n: 'Lubin',          lat: 51.40, lon: 16.20, tz: 1, dst: 'eu' },
    { n: 'Inne miasto w Polsce', lat: 52.00, lon: 19.00, tz: 1, dst: 'eu' }
  ];

  var CITIES_EN = [
    { n: 'London',        lat: 51.51, lon: -0.13,   tz: 0,  dst: 'eu' },
    { n: 'Manchester',    lat: 53.48, lon: -2.24,   tz: 0,  dst: 'eu' },
    { n: 'Dublin',        lat: 53.35, lon: -6.26,   tz: 0,  dst: 'eu' },
    { n: 'New York',      lat: 40.71, lon: -74.01,  tz: -5, dst: 'us' },
    { n: 'Los Angeles',   lat: 34.05, lon: -118.24, tz: -8, dst: 'us' },
    { n: 'Chicago',       lat: 41.88, lon: -87.63,  tz: -6, dst: 'us' },
    { n: 'Houston',       lat: 29.76, lon: -95.37,  tz: -6, dst: 'us' },
    { n: 'Miami',         lat: 25.76, lon: -80.19,  tz: -5, dst: 'us' },
    { n: 'Toronto',       lat: 43.65, lon: -79.38,  tz: -5, dst: 'us' },
    { n: 'Vancouver',     lat: 49.28, lon: -123.12, tz: -8, dst: 'us' },
    { n: 'Berlin',        lat: 52.52, lon: 13.40,   tz: 1,  dst: 'eu' },
    { n: 'Paris',         lat: 48.86, lon: 2.35,    tz: 1,  dst: 'eu' },
    { n: 'Madrid',        lat: 40.42, lon: -3.70,   tz: 1,  dst: 'eu' },
    { n: 'Rome',          lat: 41.90, lon: 12.50,   tz: 1,  dst: 'eu' },
    { n: 'Amsterdam',     lat: 52.37, lon: 4.90,    tz: 1,  dst: 'eu' },
    { n: 'Warsaw',        lat: 52.23, lon: 21.01,   tz: 1,  dst: 'eu' },
    { n: 'Stockholm',     lat: 59.33, lon: 18.07,   tz: 1,  dst: 'eu' },
    { n: 'Istanbul',      lat: 41.01, lon: 28.98,   tz: 3,  dst: '' },
    { n: 'Dubai',         lat: 25.20, lon: 55.27,   tz: 4,  dst: '' },
    { n: 'Mumbai',        lat: 19.08, lon: 72.88,   tz: 5.5, dst: '' },
    { n: 'Singapore',     lat: 1.35,  lon: 103.82,  tz: 8,  dst: '' },
    { n: 'Manila',        lat: 14.60, lon: 120.98,  tz: 8,  dst: '' },
    { n: 'Tokyo',         lat: 35.68, lon: 139.69,  tz: 9,  dst: '' },
    { n: 'Sydney',        lat: -33.87, lon: 151.21, tz: 10, dst: 'south' },
    { n: 'Melbourne',     lat: -37.81, lon: 144.96, tz: 10, dst: 'south' },
    { n: 'Auckland',      lat: -36.85, lon: 174.76, tz: 12, dst: 'south' },
    { n: 'Johannesburg',  lat: -26.20, lon: 28.05,  tz: 2,  dst: '' },
    { n: 'Lagos',         lat: 6.52,  lon: 3.38,    tz: 1,  dst: '' },
    { n: 'Mexico City',   lat: 19.43, lon: -99.13,  tz: -6, dst: '' },
    { n: 'São Paulo',     lat: -23.55, lon: -46.63, tz: -3, dst: '' },
    { n: 'Buenos Aires',  lat: -34.60, lon: -58.38, tz: -3, dst: '' },
    { n: 'Other city',    lat: 51.51, lon: -0.13,   tz: 0,  dst: 'eu' }
  ];

  
  function lastSunday(y, monthIdx) {
    var d = new Date(Date.UTC(y, monthIdx + 1, 0));
    return d.getUTCDate() - d.getUTCDay();
  }
  function nthSunday(y, monthIdx, n) {
    var first = new Date(Date.UTC(y, monthIdx, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  }
  function dstOffset(rule, y, m, d) {
    if (rule === 'eu') {
      if (m < 3 || m > 10) return 0;
      if (m > 3 && m < 10) return 1;
      if (m === 3) return d >= lastSunday(y, 2) ? 1 : 0;
      return d < lastSunday(y, 9) ? 1 : 0;
    }
    if (rule === 'us') {
      if (y >= 2007) {
        if (m < 3 || m > 11) return 0;
        if (m > 3 && m < 11) return 1;
        if (m === 3) return d >= nthSunday(y, 2, 2) ? 1 : 0;
        return d < nthSunday(y, 10, 1) ? 1 : 0;
      }
      if (m < 4 || m > 10) return 0;
      if (m > 4 && m < 10) return 1;
      if (m === 4) return d >= nthSunday(y, 3, 1) ? 1 : 0;
      return d < lastSunday(y, 9) ? 1 : 0;
    }
    if (rule === 'south') { return (m > 4 && m < 10) ? 0 : 1; }
    return 0;
  }
  /* Локальное время рождения -> объект Date в UTC. */
  function toUTC(y, m, d, h, min, city) {
    var off = city.tz + dstOffset(city.dst, y, m, d);
    return new Date(Date.UTC(y, m - 1, d, h, min, 0) - off * 3600000);
  }

  g.CITIES = { pl: CITIES_PL, en: CITIES_EN };
  g.TZ = { dstOffset: dstOffset, toUTC: toUTC };
})(typeof window !== 'undefined' ? window : globalThis);
