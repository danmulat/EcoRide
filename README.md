# EcoRide

Kenya-focused carpooling demo for finding rides, publishing a route, and sharing travel impact.

## Preview

The live app is deployed with GitHub Pages at:

https://danmulat.github.io/EcoRide/

The first deployment runs automatically after changes are pushed to `main`. Check the repository's **Actions** tab for deployment status.

## Run locally

```sh
npm install
npm run dev
```

## Demo accounts

- Lydia: passenger who can request seats
- Yohanna: driver who can publish rides and accept Lydia's requests

Demo rides and requests are kept in browser memory and reset on refresh. Authentication, persistence, and payment processing are not connected.