# Kitchen Table architecture

One ASP.NET Core 10 process owns the household's data, exposes a JSON API and serves the exported React Native Web client. This keeps a Pi deployment to one service and one SQLite database. The native app uses the same screens and API. SQLite transactions cover operations across recipes, meals and shopping without introducing a second service to coordinate them.

```mermaid
flowchart TB
    K["Pi display · Chromium"] --> W["Bundled web client"]
    B["Phone or tablet browser"] --> W
    W --> A["ASP.NET Core API on the Pi"]
    N["iOS or Android · Expo client"] --> A
    A --> C["Calendar and household"]
    A --> R["Cookbook and meal planning"]
    A --> S["Weekly shopping"]
    C --> D[("SQLite")]
    R --> D
    S --> D
```

## Controllers, models and services

Start in `server/Controllers/` to find a route. Every resource has one MVC controller file. Each action delegates to an injected service or returns a readiness response. Request and response models each have their own file in `server/Models/`.

| Resource | Controller file | Service contract | Responsibility |
| --- | --- | --- | --- |
| Health | `HealthController.cs` | Direct response | Report that the service started and migrations completed. |
| Week | `WeekController.cs` | `IWeekService` | Load a consistent household snapshot for the selected Monday. |
| People | `PeopleController.cs` | `IPersonService` | Save or remove a household member. |
| Recipes | `RecipesController.cs` | `IRecipeService` | Save or remove a recipe with its ordered ingredients and steps. |
| Calendar entries | `EntriesController.cs` | `IEntryService` | Save or remove an appointment or chore, or change a chore's completion state. |
| Planned meals | `MealsController.cs` | `IMealService` | Save or remove a recipe, serving count and meal slot for a day. |
| Shopping | `ShoppingController.cs` | `IShoppingService` | Add or remove manual items and check off items on the weekly list. |

Inside `server/Services/`, `Interfaces/` contains the contracts, `Abstract/` contains the shared base class, and `Concrete/` contains each implementation. `VersionedService<TInput>` opens the write transaction for saves and deletes. It checks edit versions for deletion and gives each subclass a version check for its own save. `WeekService` and `ShoppingService` use their own transaction rules.

### Follow a recipe save

1. `client/src/forms/RecipeForm.tsx` collects the title, base servings, ingredients and steps. Its shared `EditorForm.tsx` submits the values and edit version through `services/apiRequest.ts` under `client/src/`.
2. `server/Controllers/RecipesController.cs` binds the URL ID and the JSON body, represented by `server/Models/RecipeInput.cs`. The action calls `IRecipeService.Save`.
3. `server/Services/Abstract/VersionedService.cs` opens a SQLite write transaction. `server/Services/Concrete/RecipeService.cs` validates the input, checks the version, and saves the recipe in that transaction.
4. The controller returns HTTP 204. The client reloads the week. `WeekService` uses `HouseholdQueries` and `ShoppingListQuery` in one read transaction so the meal plan and shopping quantities agree.

`Program.cs` builds and starts the host, applies database migrations and connects the middleware and controllers. `Configuration/ServiceRegistration.cs` wires service interfaces to their implementations. `Middleware/ApiExceptionHandler.cs` translates application and SQLite errors into HTTP responses.

### React Native source

`client/src/App.tsx` loads fonts and the safe-area provider. `screens/HouseholdApp.tsx` owns the selected tab, week and active editor. The four screen files render the planner, cookbook, shopping list and household. Under `screens/planner/`, `DaySelector.tsx`, `DayAgenda.tsx` and `MealPlan.tsx` implement the three parts of the planner.

`forms/` holds recipe, calendar entry, meal and person forms. `components/` holds shared controls and dialogs. `hooks/useBoard.ts` manages polling and cancellation, while `hooks/useHouseholdWrite.ts` handles the pending state for direct edits such as checking off an item. `services/parseRecipe.ts` converts pasted text into a draft the user can review.

## Storage and calendar semantics

| Table | Important fields and relationships |
| --- | --- |
| `people` | Name, colour and edit version. One person can have many calendar entries. A null assignee displays as Everyone. |
| `entries` | Civil date, event or chore, optional start and end, optional person, completion and edit version. |
| `recipes` | Base servings and ordered JSON arrays for ingredients and steps. Each ingredient has a name, optional decimal amount and unit. Each recipe is edited as one document. |
| `meals` | Required recipe, planned servings, civil date and slot. A unique index enforces one Breakfast, Lunch, Dinner or Snack per day. |
| `shopping_checks` | Week and a deterministic ingredient-and-quantity key. Rows represent checked items. |
| `extras` | Manual shopping items with an independent ID, week and checked state. |
| `schema_versions` | Ordered migrations already applied. Startup runs pending migrations in a transaction and rejects a newer unknown schema. |

Weeks start on Monday and use a half-open interval through the following Monday. The Pi calculates today in `KitchenTable__TimeZone`, defaulting to `Europe/London`. Dates travel as `YYYY-MM-DD` and wall times as `HH:mm`. Blank times represent an all-day entry. This preserves an appointment at 09:00 on the kitchen display when a phone uses a different device time zone. Overnight events, recurrence and exact UTC instants require a richer event model.

## From recipe to shopping list

For each meal, scale each numeric ingredient by **planned servings ÷ recipe servings**. Sum matching names and units across the week after trimming, case-folding and collapsing whitespace. Display the first ingredient's spelling. Measured and unmeasured entries form distinct groups. Totals use decimal arithmetic and round once to six decimal places. For example, a 200 g ingredient in a four-serving recipe contributes 100 g for a two-serving lunch and 300 g for a six-serving dinner. The shopping list shows a single 400 g line.

Grams and kilograms remain separate until a unit-conversion policy is introduced. A blank quantity allows entries such as “salt to taste”. Imported ambiguous quantities stay as text for the cook to review. Changes to the recipe affect every meal that references it. A check represents one exact total for that week, so a changed amount appears unchecked unless that same total was already bought. Manual extras survive meal changes. This projection works without a job queue or rebuilding stored list rows.

## HTTP contract

JSON uses camelCase. Each edit request carries `X-Kitchen-Table: 1`. The deployed browser uses its own origin. A single explicit development web origin can use CORS. Native clients supply the API origin at build time.

| Method | Path under `/api` | Result |
| --- | --- | --- |
| GET | `/health` | Service readiness after successful migration |
| GET | `/week` or `/week?start=2026-11-23` | One consistent snapshot with start, today, timeZone, people, recipes, entries, meals and shopping |
| PUT | `/people/{id}` | Create or edit a name and colour |
| PUT | `/recipes/{id}` | Save a complete recipe and its ordered ingredients and steps |
| PUT | `/entries/{id}` | Save an event or chore, optional person and times |
| PATCH | `/entries/{id}/done` | Set a chore's checked state using `{"done":true}` or `false` in the same field |
| PUT | `/meals/{id}` | Save the recipe, date, meal slot and planned servings |
| DELETE | `/{people,recipes,entries,meals}/{id}?version=N` | Remove the selected entity at its current version |
| PUT | `/shopping/{week}/extras/{id}` | Add a manual item with `{"label":"Milk"}` |
| DELETE | `/shopping/{week}/extras/{id}` | Remove that manual item |
| PATCH | `/shopping/{week}/{itemId}/done` | Set the displayed shopping row's checked state |

Example meal creation using the included starter recipe and a caller-generated UUID.

```http
PUT /api/meals/8a7938e068754abc9c73a451088ba56c
Content-Type: application/json
X-Kitchen-Table: 1

{"day":"2026-11-24","slot":"Dinner","recipeId":"e67d700b33254ba4855344392c7bc3c4","servings":6,"version":0}
```

Writes return HTTP 204. Read the week again to obtain current versions and the recalculated list. Invalid content returns 400. Conflicting changes, occupied slots and referenced items return 409 with a problem-details message. A stale edit stays open in the UI so the user can review it.

## Concurrency and device refresh

- The client assigns an ID once when opening a create form. Version 0 creates the record. Updates and deletes include the version the user saw. A reserved SQLite writer transaction checks the version and updates it together. A repeated create cannot insert a second copy with that ID.
- Chore and shopping requests set the desired checked state. Repeating the same request leaves the state consistent. The meal slot constraint also handles two devices planning the same slot concurrently.
- A week loads in one read transaction with WAL enabled. The API returns a coherent calendar, meal plan and shopping list to the client. The UI refreshes after writes, on return to the foreground and every 15 seconds. Superseded reads cannot replace a newer result.
- The browser and native client keep presentation state in memory. A connection failure leaves an explicit error and any unsaved form visible. Household profiles are display labels. The initial access model grants the same permissions to every device on the home network.

## Extension points

| Later capability | Where it fits |
| --- | --- |
| Recipe websites or social sharing | Map permitted import sources to the existing recipe draft. Preserve source attribution, display the draft for correction, then use the existing save API. The text importer demonstrates this flow. |
| Shared calendar feeds | Add a source and external UID to imported events. Model recurrence exceptions, date-only events and time zones before adding a scheduled importer. |
| Large cookbooks | Split recipe summaries from full recipe detail. The starter sends the small household catalogue with each snapshot. |
| Accounts or remote access | Introduce authentication, per-household authorisation and HTTPS at the API boundary before making a release available outside the home. |

## Design references

The recipe-to-plan-to-list workflow draws on ReciMe. The wall display, family colours and shared tasks draw on Skylight Calendar. [ReciMe](https://www.recime.app/) · [Skylight Calendar](https://myskylight.com/en-gb/calendar/)

The client uses Expo's universal web approach. The deployment uses Microsoft's self-contained Linux ARM64 target and the Pi desktop kiosk pattern. [Expo web](https://docs.expo.dev/workflow/web/) · [.NET ARM deployment](https://learn.microsoft.com/en-us/dotnet/iot/deployment) · [Raspberry Pi kiosk guide](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)
