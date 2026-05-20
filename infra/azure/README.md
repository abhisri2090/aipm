# Azure deployment (planned)

MVP registry targets:

- **Azure App Service** — `registry-api`
- **Azure Database for PostgreSQL** — metadata
- **Azure Blob Storage** — package tarballs

Set `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, and `PORT` on the app service.

Local dev uses `docker-compose.yml` + filesystem storage under `AIPM_DATA_DIR`.
