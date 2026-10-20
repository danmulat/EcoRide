# EcoRide

Kenya-focused carpooling demo for finding rides, publishing a route, and sharing travel impact.

## Preview

GitHub Pages preview URL: https://danmulat.github.io/EcoRide/

To activate the preview, open [Pages settings](https://github.com/danmulat/EcoRide/settings/pages) and select **GitHub Actions** under **Build and deployment**. Then rerun the failed deployment from the repository's **Actions** tab. Future pushes to `main` will deploy automatically.

## Run locally

```sh
npm install
npm run dev
```

## Demo accounts

- Lydia: passenger who can request seats
- Yohanna: driver who can publish rides and accept Lydia's requests

Demo rides and requests are kept in browser memory and reset on refresh. Authentication, persistence, and payment processing are not connected.