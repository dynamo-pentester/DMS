# Driver Management System — Foundation (Sprint 1 scaffold)

This is the **foundation phase** from the plan's roadmap, not the full system:
solution + project references + DbContext + BaseEntity + Identity/Roles + Driver CRUD
(the one complete vertical slice: Login → Create → List → View → Edit → Soft Delete).

Everything else (Transporters beyond the history table, Medical, Training, Incidents,
Plant Movement, Documents, Notifications, Audit UI, Reports) follows the same pattern
established here — see `Driver_DMS_Final_Plan.md` §7 for the sprint order.

## What's actually implemented vs. stubbed

| Area | Status |
|---|---|
| Solution structure, project references, dependency rule | ✅ Done |
| `BaseEntity` (audit + soft delete + `RowVersion`) | ✅ Done |
| `DriverDmsContext` (Identity + Driver domain + Fluent API constraints/indexes) | ✅ Done |
| Driver CRUD + search (`DriverService`, `DriversController`) | ✅ Done |
| Transporter history (`DriverTransporterHistory`, filtered unique index) | ✅ Done |
| License + `LicenseEndorsements` M:N | ✅ Done (entity + config only) |
| `SystemConfiguration` + `LicenseStatusResolver` | ✅ Done |
| `ExpiryAlertJob` | ⚠️ Logs expiring licenses; doesn't persist a `Notification` row yet — that table is Sprint 4 scope (see the class-level comment in the file) |
| Notifications, MedicalRecords, Trainings, Incidents, CorrectiveActions, PlantMovements, Documents, AuditLogs writer | ❌ Not scaffolded — entities for `SystemConfiguration`/`AuditLog` exist in Domain but aren't wired into every flow yet |
| Roles seeding | ✅ Done — seeds the 6 roles from design doc §4.1 on startup |
| Unit tests | ✅ Two tests proving `DriverCode` generation and the soft-delete override actually work (not just structural/example code) |

## Security note (fixed after the first `dotnet restore`)

The first restore surfaced real `NU1903` vulnerability warnings, not noise:

- **AutoMapper 12.0.1** — confirmed CVE, will never be patched at that version. Worse,
  the maintainer took AutoMapper commercial in July 2025; the patched versions (15.1.1+)
  fall under a new dual license (free under $5M revenue, paid above that). Since nothing
  in this codebase actually calls AutoMapper — `DriverService` already hand-maps —
  **removed entirely** rather than pulled into a licensing question over an unused
  dependency.
- **Newtonsoft.Json 11.0.1** and **System.Security.Cryptography.Xml 9.0.0** — both
  pulled in transitively at old, CVE-affected floors despite targeting .NET 10. Pinned
  explicitly to patched versions in the relevant `.csproj` files (NuGet resolves to the
  highest version requested anywhere in the graph, so an explicit direct reference
  overrides a vulnerable transitive one).

Run `dotnet restore` again after pulling this version — should come back clean. If a
future package bump reintroduces a transitive floor below the pinned version, `dotnet
list package --vulnerable` will catch it.



## Prerequisites (matches what was verified earlier in this project)

- .NET SDK 10.x (`dotnet --version` should show `10.x`)
- SQL Server (LocalDB, Express, or full) reachable at the connection string in `appsettings.json`
- Visual Studio 2022 (latest) or `dotnet` CLI

## Setup

```powershell
cd DriverManagementSystem

# 1. Restore + build
dotnet restore
dotnet build

# 2. Set the JWT signing key via user-secrets - NEVER put this in appsettings.json
cd src/Driver.API
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "replace-with-a-real-32+-char-random-secret"
cd ../..

# 3. Point the connection string at your SQL Server instance if it isn't
#    ".\SQLEXPRESS" with Windows auth - edit src/Driver.API/appsettings.json

# 4. Create the first migration and apply it
#    (run from the solution root; -p is the project holding DbContext, -s is the startup project)
dotnet ef migrations add InitialCreate -p src/Driver.Infrastructure -s src/Driver.API
dotnet ef database update -p src/Driver.Infrastructure -s src/Driver.API

# 5. Run
dotnet run --project src/Driver.API
```

If `dotnet ef` isn't recognized, install the tool once: `dotnet tool install --global dotnet-ef`

## Verify it worked

- Swagger UI should come up at `https://localhost:<port>/swagger` in Development.
- `DriverManagementDB` should now exist in SSMS with `AspNetRoles` already containing
  the 6 seeded roles, plus `Drivers`, `Licenses`, `LicenseEndorsements`,
  `DriverTransporterHistories`, `Transporters`, `SystemConfigurations`, and the lookup tables.
- `POST /api/drivers` (as an authenticated System Administrator or HR Executive) should
  create a driver with a generated `DRV-2026-000001`-style code.
- `DELETE /api/drivers/{id}` should NOT remove the row from the table — check
  `IsDeleted`/`DeletedAt`/`DeletedBy` got set instead.

## Run the tests

```powershell
dotnet test
```

Both tests use EF Core's InMemory provider against the **real** `DriverDmsContext` —
not a hand-rolled duplicate — specifically so they exercise the actual soft-delete
override in `DriverDmsContext.ApplyAuditAndSoftDeleteConventions()`, not a copy of it
that could silently drift from the real implementation.

## Before you write the next module (Transporters/Medical/Training/etc.)

Follow the exact same pattern each time:
1. Add the entity to `Driver.Domain/Entities`, inheriting `BaseEntity` if it's a business table.
2. Add it to `IApplicationDbContext` and `DriverDmsContext` (DbSet + Fluent API config —
   indexes, constraints, soft-delete query filter).
3. Add DTOs + `I<X>Service`/`<X>Service` in `Driver.Application`.
4. Add the controller in `Driver.API`, with `[Authorize(Roles = "...")]` matching the
   authorization matrix in the design doc §4.1.
5. `dotnet ef migrations add <Name>` — never hand-edit the database in SSMS (design doc §6, "Database = Code").

## Known gaps carried over from the design doc (§5 open questions)

Don't build Goods Transaction, Workflow, or `PlantMovements.VehicleType` blind — they're
listed in the design doc as pending client confirmation, not decided.
