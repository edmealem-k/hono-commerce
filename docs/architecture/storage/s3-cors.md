# S3 browser upload CORS policy

The bucket used by the API must allow only the deployed storefront and dashboard origins to upload directly with presigned `PUT` requests.

Replace the example origins with the actual HTTPS origins before applying this in AWS:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3001",
      "http://localhost:3002",
      "https://store.example.com",
      "https://app.example.com"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "If-None-Match"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 300
  }
]
```

The application does not make the bucket public. Read access continues to use short-lived signed `GET` URLs. Do not add `*` to `AllowedOrigins` or `AllowedHeaders` for a production bucket.
