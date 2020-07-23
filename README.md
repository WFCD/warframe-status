# warframe-status

Simple express app that parses worldState.php


[![Build Status](https://travis-ci.com/WFCD/warframe-status.svg?branch=master)](https://travis-ci.com/WFCD/warframe-status) [![Swagger Docs](https://img.shields.io/badge/docs-Swagger-brightgreen.svg)](https://docs.warframestat.us)
[![Supported by the Warframe Community Developers](https://img.shields.io/badge/Warframe_Comm_Devs-supported-blue.svg?color=2E96EF&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOTgiIGhlaWdodD0iMTczIiB2aWV3Qm94PSIwIDAgMjk4IDE3MyI%2BPHBhdGggZD0iTTE4NSA2N2MxNSA4IDI4IDE2IDMxIDE5czIzIDE4LTcgNjBjMCAwIDM1LTMxIDI2LTc5LTE0LTctNjItMzYtNzAtNDUtNC01LTEwLTEyLTE1LTIyLTUgMTAtOSAxNC0xNSAyMi0xMyAxMy01OCAzOC03MiA0NS05IDQ4IDI2IDc5IDI2IDc5LTMwLTQyLTEwLTU3LTctNjBsMzEtMTkgMzYtMjIgMzYgMjJ6TTU1IDE3M2wtMTctM2MtOC0xOS0yMC00NC0yNC01MC01LTctNy0xMS0xNC0xNWwxOC0yYzE2LTMgMjItNyAzMi0xMyAxIDYgMCA5IDIgMTQtNiA0LTIxIDEwLTI0IDE2IDMgMTQgNSAyNyAyNyA1M3ptMTYtMTFsLTktMi0xNC0yOWEzMCAzMCAwIDAgMC04LThoN2wxMy00IDQgN2MtMyAyLTcgMy04IDZhODYgODYgMCAwIDAgMTUgMzB6bTE3MiAxMWwxNy0zYzgtMTkgMjAtNDQgMjQtNTAgNS03IDctMTEgMTQtMTVsLTE4LTJjLTE2LTMtMjItNy0zMi0xMy0xIDYgMCA5LTIgMTQgNiA0IDIxIDEwIDI0IDE2LTMgMTQtNSAyNy0yNyA1M3ptLTE2LTExbDktMiAxNC0yOWEzMCAzMCAwIDAgMSA4LThoLTdsLTEzLTQtNCA3YzMgMiA3IDMgOCA2YTg2IDg2IDAgMCAxLTE1IDMwem0tNzktNDBsLTYtNmMtMSAzLTMgNi02IDdsNSA1YTUgNSAwIDAgMSAyIDB6bS0xMy0yYTQgNCAwIDAgMSAxLTJsMi0yYTQgNCAwIDAgMSAyLTFsNC0xNy0xNy0xMC04IDcgMTMgOC0yIDctNyAyLTgtMTItOCA4IDEwIDE3em0xMiAxMWE1IDUgMCAwIDAtNC0yIDQgNCAwIDAgMC0zIDFsLTMwIDI3YTUgNSAwIDAgMCAwIDdsNCA0YTYgNiAwIDAgMCA0IDIgNSA1IDAgMCAwIDMtMWwyNy0zMWMyLTIgMS01LTEtN3ptMzkgMjZsLTMwLTI4LTYgNmE1IDUgMCAwIDEgMCAzbDI2IDI5YTEgMSAwIDAgMCAxIDBsNS0yIDItMmMxLTIgMy01IDItNnptNS00NWEyIDIgMCAwIDAtNCAwbC0xIDEtMi00YzEtMy01LTktNS05LTEzLTE0LTIzLTE0LTI3LTEzLTIgMS0yIDEgMCAyIDE0IDIgMTUgMTAgMTMgMTNhNCA0IDAgMCAwLTEgMyAzIDMgMCAwIDAgMSAxbC0yMSAyMmE3IDcgMCAwIDEgNCAyIDggOCAwIDAgMSAyIDNsMjAtMjFhNyA3IDAgMCAwIDEgMSA0IDQgMCAwIDAgNCAwYzEtMSA2IDMgNyA0aC0xYTMgMyAwIDAgMCAwIDQgMiAyIDAgMCAwIDQgMGw2LTZhMyAzIDAgMCAwIDAtM3oiIGZpbGw9IiMyZTk2ZWYiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg%3D%3D)](https://github.com/WFCD/banner/blob/master/PROJECTS.md)
[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)

[![PC API Status](https://img.shields.io/website/https/api.warframestat.us/pc.svg?down_message=down&label=pc%20api&logo=steam&up_message=up)](https://api.warframestat.us/pc)
[![PS4 API Status](https://img.shields.io/website/https/api.warframestat.us/ps4.svg?down_message=down&label=ps4%20api&logo=playstation&up_message=up)](https://api.warframestat.us/ps4)
[![XB1 API Status](https://img.shields.io/website/https/api.warframestat.us/xb1.svg?down_message=down&label=xb1%20api&logo=xbox&up_message=up)](https://api.warframestat.us/xb1)
[![Switch API Status](https://img.shields.io/website/https/api.warframestat.us/swi.svg?down_message=down&label=switch%20api&logo=nintendo-switch&up_message=up)](https://api.warframestat.us/swi)

## Access

### REST-ish:

- `http://$host:$port/$platform`
- `http://$host:$port/$platform/$child-item`
- `http://$host:$port/$a-bunch-of-static-data`


### Sockets:

`ws://$host:$port/sockets`

Requests taken as json strings in the socket packet.

Consumers will need to parse responses and stringify requests yourself, as ws doesn't provide a way to automatically parse them.

- ```json
{"event": "ws:req", "packet": { "platform": "$platform", "language": "$language" }}
```
- ```json
{ "event": "twitter" }
```
- ```json
{ "event": "rss" }
```


connecting automatically subscribes the connection to events structured as:
```json
{
  "event": "twitter",
  "packet": // tweets
}
```

```json
{
  "event": "ws:update",
  "packet": // entire updated worldstate
}
```

```json
{
  "event": // worldstate key,
  "packet": // worldstate key data
}
```

probably several others that can take some experimenting