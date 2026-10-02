# Azure backend deploy (Life RPG)

The API, Bicep IaC, and Azure DevOps pipeline are implemented under `backend/`. Deploy is **blocked until App Service quota** is available on the subscription (new subs often start at quota `0`).

## Prerequisites

- Pay-As-You-Go subscription (or quota increase) with **App Service** capacity in the target region.
- Azure CLI (`az`) logged in.
- .NET 8 SDK + `dotnet-ef` for migrations.
- Secrets: `Jwt:SigningKey`, `Llm:ApiKey` (Gemini), SQL admin password.

## Region

Use **North Europe** (`northeurope`). Resource group: `rg-liferpg`. West Europe may block SQL Server creation for some subscriptions.

## Steps (after quota clears)

1. **Deploy infrastructure**
   ```bash
   cd backend/infra
   az deployment group create \
     --resource-group rg-liferpg \
     --template-file main.bicep \
     --parameters @main.bicepparam   # adjust param file if present
   ```

2. **Database**
   ```bash
   cd backend
   dotnet ef database update \
     -p src/LifeRpg.Infrastructure \
     -s src/LifeRpg.Api \
     --connection "<Azure SQL connection string>"
   ```
   Open SQL firewall for your client IP if migrating from a dev machine.

3. **App settings / Key Vault**
   - Wire Key Vault references from Bicep (managed identity).
   - Confirm `Jwt:SigningKey`, `Llm:ApiKey`, and connection string resolve on the App Service.

4. **Publish API**
   ```bash
   dotnet publish src/LifeRpg.Api -c Release -o ./publish
   az webapp deploy --resource-group rg-liferpg --name <app-name> --src-path ./publish.zip
   ```

5. **Smoke test**
   - `GET https://<app-name>.azurewebsites.net/health/ready`
   - Register/login, complete a quest, `POST /api/v1/sync`, forge skill via Gemini.

6. **Point the web client at the API**
   - Vercel (or EAS) env:
     - `EXPO_PUBLIC_DEMO_MODE=false`
     - `EXPO_PUBLIC_API_URL=https://<app-name>.azurewebsites.net`
   - Redeploy the Expo web build.

## Quota check (optional)

```bash
az account show --query "{name:name, id:id}"
az quota list --scope "/subscriptions/<sub-id>/providers/Microsoft.Web/locations/northeurope" -o table
```

If App Service quota is `0`, request an increase in Azure Portal → Subscriptions → Usage + quotas.

## Client builds (EAS)

Preview APK (internal) is configured in [`eas.json`](../eas.json) with the production API URL placeholder:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Requires Expo account and completes only after the API URL is live.
