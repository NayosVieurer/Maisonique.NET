# Kitchen Table

A local household planner for a Raspberry Pi. A recipe in the cookbook can become Tuesday's dinner, appear beside the family's appointments and supply the right quantities to the shared shopping list. The Pi holds the household's only database. The kitchen screen and phones use the same application.

## Where to start reading the code

To follow a recipe save, open `client/src/forms/RecipeForm.tsx`, then `server/Controllers/RecipesController.cs`. The controller accepts a `RecipeInput` and calls `IRecipeService.Save`. Its concrete implementation, `RecipeService`, validates the recipe and writes it to SQLite. The editable TypeScript and JSX live in `client/src/`. The compiled files served to browsers live in `server/wwwroot/`.

## Run it on a development computer

Install the .NET 10 SDK. From a fresh Git clone, also install Node 22.13 or newer and build the web client once from the repository root using Bash.

```sh
bash deploy/build-web.sh
```

The downloadable source ZIP already includes the compiled web client. Start the app from the directory containing this README. The first run restores the .NET dependencies.

```sh
dotnet run --project server -- --urls http://127.0.0.1:5080
```

Open **http://127.0.0.1:5080**. On first launch the server creates the database and an editable lemon and pea pasta recipe. Household names and dates are yours to add.

1. In **Household**, add a name and choose a colour.
2. In **Planner**, select a day, choose **Add event or chore** and assign it to that person.
3. In **Recipes**, open **Lemon & pea pasta** and choose **Plan this recipe**. Pick a date in the displayed week, Dinner and six servings.
4. Open **Shopping** for that week. The four-serving recipe's 320 g of pasta becomes 480 g. Change the planned servings and the list updates. Check an ingredient or add a household extra.

## Run it on the Raspberry Pi

The companion **KitchenTable-Pi-linux-arm64.tar.gz** includes the app, web client, .NET runtime, systemd service and kiosk launcher. The target is a Pi 4 or 5 with **64-bit Raspberry Pi OS**. The Pi only needs a desktop installation when it drives a screen. To install, extract the release on the Pi and run its install script. The service starts at boot and keeps household data outside its application directory. [Pi installation, phone access, backups and updates](docs/pi.md)

To build that release yourself on a development computer with Bash and the .NET 10 SDK, run the following command. It reuses the bundled web client. After editing frontend code, run the web build first.

```sh
bash deploy/publish-pi.sh
```

## Develop the React Native client

Use Node 22.13 or newer with npm. The client is TypeScript and Expo SDK 58. The web, iOS and Android targets share components, validation and API calls. The Pi serves the exported website directly on port 5080. Metro runs on the development computer during UI development.

```sh
# From the repository root, refresh the web client served by ASP.NET.
bash deploy/build-web.sh
```

For hot reload on a development computer, start the API in one terminal. The development origin is exact and must match the origin in the browser.

```sh
ASPNETCORE_ENVIRONMENT=Development KitchenTable__DevOrigin=http://localhost:8081 \
  dotnet run --project server -- --urls http://0.0.0.0:5080
```

In another terminal, run these commands and open **http://localhost:8081**. Port 8081 must be available for this example.

```sh
cd client
npm ci
EXPO_PUBLIC_API_URL=http://localhost:5080 npm run web -- --port 8081
```

For native development, put `EXPO_PUBLIC_API_URL=http://kitchen-table.local:5080` in `client/.env.local`. Use the actual Pi hostname or LAN address. Start the Pi service, connect the device to the same network and run `npm start -- --lan` from `client`. Use an Expo Go version supporting SDK 58, or a local native development build. The Expo mobile QR code connects the device to Metro. The API address points it to the Pi. A phone's `localhost` means the phone itself.

For a locally compiled standalone app, set the same API origin at build time and run `npx expo run:android --variant release` or `npx expo run:ios --configuration Release` (macOS and Xcode). Android permits cleartext LAN traffic for this home build. On iOS, allow Local Network access and use a `.local` hostname for HTTP. A phone browser can open the Pi directly without a native build.

## Source map

| Location | Contents |
| --- | --- |
| `server/Controllers/` | One MVC controller per API resource. Save and delete actions for a recipe are together in `RecipesController.cs`. |
| `server/Models/` | One named C# model per file, including the request models and the responses returned by the API. |
| `server/Services/Interfaces/` | Contracts consumed by the controllers, such as `IRecipeService.cs`. |
| `server/Services/Abstract/` | `VersionedService.cs` provides the transaction and edit-version behaviour shared by people, recipes, entries and meals. |
| `server/Services/Concrete/` | The six service implementations, each in its own file. |
| `server/Infrastructure/` | SQLite access, migrations, validation, week queries and the shopping list calculation. |
| `server/Configuration/`, `server/Middleware/` | Dependency registration, API request headers and exception handling. `Program.cs` wires up the application. |
| `client/src/screens/`, `forms/`, `components/` under `client/src/` | Screens assemble the UI, forms manage edits and reusable components render controls. The planner's day selector, agenda and meal plan each have a file. |
| `client/src/hooks/`, `services/`, `models/` under `client/src/` | Week refresh and write state, API requests and recipe parsing, and shared data types. |
| `tests/`, `deploy/` | HTTP and recipe parser tests, web and ARM64 builds, system service and kiosk scripts. |

The architecture note includes the component diagram, data model, HTTP contract, consistency rules and suggested integration points. [Architecture and API](ARCHITECTURE.md)

## Formatting

C# uses four spaces, braces on separate lines and blank lines between logical blocks. The React project uses two spaces and the checked-in Prettier configuration. From `client/`, run `npm run format` to apply the style or `npm run format:check` to check it. An editor with EditorConfig support will also pick up the repository settings.

## Verify a change

```sh
# Python 3.9+ and a .NET 10 SDK. The test starts its own server and temporary database.
python3 tests/smoke.py
# Node 22.13+. Tests the pasted ingredient syntax and draft creation.
node --experimental-strip-types --test tests/recipe-import.mjs
# From client/ after npm ci
npm run typecheck
npm run format:check
npm run export:web
```

## Scope of the starter

The first release supports one household, one shared kitchen time zone, single-day events, one-off chores, editable recipes, recipe-text import, four meal slots per day, planned servings and weekly shopping. It assumes trusted home Wi-Fi. Every device with access to the service can edit the household. The Pi must be reachable for changes. Ordinary use requires no internet connection after installation.

Direct social or URL recipe imports, external calendar synchronisation, recurring events, remote accounts and disconnected phone editing are future integrations. [Extension points](ARCHITECTURE.md#extension-points)
