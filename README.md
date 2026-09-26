# DxE GeoJSON

Simple proxy for the DxE chapters API, converted into GeoJSON. Used on [animalrightsmap.org].

## Deployment

It runs on Coolify as `animalrightsmap-dxe-geojson-proxy`, in the Animal Rights
Map project, and serves https://dxe-geojson.animalrightsmap.org. Every push to
`main` deploys it.

To run it locally:

- `$ pnpm install`
- `$ pnpm dev`

[animalrightsmap.org]: https://animalrightsmap.org
