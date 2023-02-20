# warframe-status

Simple express app that parses worldState.php


[![Supported by the Warframe Community Developers](https://img.shields.io/badge/Warframe_Comm_Devs-supported-blue.svg?color=2E96EF&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTgiIGhlaWdodD0iMTczIiB2aWV3Qm94PSIwIDAgMjk4IDE3MyI%2BPHBhdGggZD0iTTE4NSA2N2MxNSA4IDI4IDE2IDMxIDE5czIzIDE4LTcgNjBjMCAwIDM1LTMxIDI2LTc5LTE0LTctNjItMzYtNzAtNDUtNC01LTEwLTEyLTE1LTIyLTUgMTAtOSAxNC0xNSAyMi0xMyAxMy01OCAzOC03MiA0NS05IDQ4IDI2IDc5IDI2IDc5LTMwLTQyLTEwLTU3LTctNjBsMzEtMTkgMzYtMjIgMzYgMjJ6TTU1IDE3M2wtMTctM2MtOC0xOS0yMC00NC0yNC01MC01LTctNy0xMS0xNC0xNWwxOC0yYzE2LTMgMjItNyAzMi0xMyAxIDYgMCA5IDIgMTQtNiA0LTIxIDEwLTI0IDE2IDMgMTQgNSAyNyAyNyA1M3ptMTYtMTFsLTktMi0xNC0yOWEzMCAzMCAwIDAgMC04LThoN2wxMy00IDQgN2MtMyAyLTcgMy04IDZhODYgODYgMCAwIDAgMTUgMzB6bTE3MiAxMWwxNy0zYzgtMTkgMjAtNDQgMjQtNTAgNS03IDctMTEgMTQtMTVsLTE4LTJjLTE2LTMtMjItNy0zMi0xMy0xIDYgMCA5LTIgMTQgNiA0IDIxIDEwIDI0IDE2LTMgMTQtNSAyNy0yNyA1M3ptLTE2LTExbDktMiAxNC0yOWEzMCAzMCAwIDAgMSA4LThoLTdsLTEzLTQtNCA3YzMgMiA3IDMgOCA2YTg2IDg2IDAgMCAxLTE1IDMwem0tNzktNDBsLTYtNmMtMSAzLTMgNi02IDdsNSA1YTUgNSAwIDAgMSAyIDB6bS0xMy0yYTQgNCAwIDAgMSAxLTJsMi0yYTQgNCAwIDAgMSAyLTFsNC0xNy0xNy0xMC04IDcgMTMgOC0yIDctNyAyLTgtMTItOCA4IDEwIDE3em0xMiAxMWE1IDUgMCAwIDAtNC0yIDQgNCAwIDAgMC0zIDFsLTMwIDI3YTUgNSAwIDAgMCAwIDdsNCA0YTYgNiAwIDAgMCA0IDIgNSA1IDAgMCAwIDMtMWwyNy0zMWMyLTIgMS01LTEtN3ptMzkgMjZsLTMwLTI4LTYgNmE1IDUgMCAwIDEgMCAzbDI2IDI5YTEgMSAwIDAgMCAxIDBsNS0yIDItMmMxLTIgMy01IDItNnptNS00NWEyIDIgMCAwIDAtNCAwbC0xIDEtMi00YzEtMy01LTktNS05LTEzLTE0LTIzLTE0LTI3LTEzLTIgMS0yIDEgMCAyIDE0IDIgMTUgMTAgMTMgMTNhNCA0IDAgMCAwLTEgMyAzIDMgMCAwIDAgMSAxbC0yMSAyMmE3IDcgMCAwIDEgNCAyIDggOCAwIDAgMSAyIDNsMjAtMjFhNyA3IDAgMCAwIDEgMSA0IDQgMCAwIDAgNCAwYzEtMSA2IDMgNyA0aC0xYTMgMyAwIDAgMCAwIDQgMiAyIDAgMCAwIDQgMGw2LTZhMyAzIDAgMCAwIDAtM3oiIGZpbGw9IiMyZTk2ZWYiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg%3D%3D)](https://github.com/WFCD/banner/blob/master/PROJECTS.md)
[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)

[![Coverage Status](https://coveralls.io/repos/github/WFCD/warframe-status/badge.svg?branch=main)](https://coveralls.io/github/WFCD/warframe-status?branch=main)
[![Release](https://github.com/WFCD/warframe-status/actions/workflows/release.yml/badge.svg)](https://github.com/WFCD/warframe-status/actions/workflows/release.yml)
[![Actions](https://github.com/WFCD/warframe-status/actions/workflows/ci.yaml/badge.svg)](https://github.com/WFCD/warframe-status/actions/workflows/ci.yaml)

[![PC API Status](https://img.shields.io/website?label=PC%20API&logo=steam&url=https%3A%2F%2Fapi.warframestat.us%2Fpc%2F%3Flanguage%3Den)](https://api.warframestat.us/pc/?language=en)
[![PS4 API Status](https://img.shields.io/website?label=PSN%20API&logo=playstation&url=https%3A%2F%2Fapi.warframestat.us%2Fps4%2F%3Flanguage%3Den)](https://api.warframestat.us/ps4/?language=en)
[![XB1 API Status](https://img.shields.io/website?label=XB%20API&logo=xbox&url=https%3A%2F%2Fapi.warframestat.us%2Fxb1%2F%3Flanguage%3Den)](https://api.warframestat.us/xb1/?language=en)
[![Switch API Status](https://img.shields.io/website?label=Switch%20API&logo=nintendo-switch&url=https%3A%2F%2Fapi.warframestat.us%2Fswi%2F%3Flanguage%3Den)](https://api.warframestat.us/swi/?language=en)

## Access

### REST-ish:

- `http://$host:$port/$platform`
- `http://$host:$port/$platform/$child-item`
- `http://$host:$port/$a-bunch-of-static-data`


### Sockets:

`ws://$host:$port/sockets`

Requests taken as json strings in the socket packet.

Consumers will need to parse responses and stringify requests yourself, as ws doesn't provide a way to automatically parse them.

```json
{"event": "ws:req", "packet": { "platform": "$platform", "language": "$language" }}
```
```json
{ "event": "twitter" }
```
```json
{ "event": "rss" }
```


connecting automatically subscribes the connection to events structured as:
```json5
{
  "event": "twitter",
  "packet": "[]" // tweets
}
```

```json5
{
  "event": "ws:update",
  "packet": "{}" // entire updated worldstate
}
```

```json5
{
  "event": "", // worldstate key,
  "packet": "" // worldstate key data
}
```

probably several others that can take some experimenting


## ENV Variables


| Key                      | Meaning                                             |
|:-------------------------|:----------------------------------------------------|
| `TWITTER_KEY`            | Twitter Account Key                                 |
| `TWITTER_SECRET`         | Twitter Account Secret                              |
| `TWITTER_BEARER_TOKEN`   | Twitter OAuth Bearer Token                          |
| `WFINFO_FILTERED_ITEMS`  | WF Info filtered items source json url              |
| `WFINFO_PRICES`          | WF Info prices source json url                      | 
| `DISABLE_PRICECHECKS`    | Disable pricecheck services                         |
| `SENTRY_DSN`             | Sentry DNS for reporting errors                     |
| `BUILD`                  | Whether or not to forcibly build caches on startup  |
| `LOG_LEVEL`              | Logging level for logging                           | 
| `HOST`/`HOSTNAME`        | host or hostname for hosting service                |
| `PORT`/`IP`              | Port or IP address for hosting service              |
