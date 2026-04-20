const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fce7f3" width="100%" height="100%"/></svg>`

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${
  typeof Buffer !== 'undefined'
    ? Buffer.from(svg).toString('base64')
    : btoa(svg)
}`
