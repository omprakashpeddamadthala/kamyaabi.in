# Spring Boot 4.1.1 Migration Report

## Versions

| Component | Before | After |
| --- | --- | --- |
| Spring Boot | 3.2.5 | 4.1.1 |
| Java | 17 | 21 |
| Maven | 3.6.3 | 3.9.11 for this migration |
| springdoc OpenAPI | 2.5.0 | 3.1.0 |
| Flyway | Boot-managed 9.x | 13.3.0 |

The system default Java 17 alternatives were restored after installing JDK 21.
The migration shell used JDK 21 and Maven 3.9.11 explicitly.

## Changes made

- Replaced the web starter with `spring-boot-starter-webmvc`.
- Added Boot 4's `spring-boot-starter-restclient` for the existing
  `RestTemplate` integration.
- Replaced the direct Flyway dependency with
  `spring-boot-starter-flyway`, added `flyway-database-postgresql`, and pinned
  Flyway to 13.3.0.
- Replaced the Boot 3 test starters with
  `spring-boot-starter-webmvc-test` and
  `spring-boot-starter-security-test`.
- Migrated Jackson core/databind imports to Jackson 3 (`tools.jackson`).
  Jackson annotation imports remain under `com.fasterxml.jackson.annotation`,
  as required by the Jackson 3 migration.
- Added a Jackson 3 mapper customizer to preserve the existing date
  serialization and empty-bean behavior.
- Replaced removed `@MockBean` usage with `@MockitoBean`.
- Updated the Actuator health contributor imports to the Boot 4 health module.
- Updated Actuator endpoint access configuration to the Boot 4 `access` keys
  while retaining the existing exposed endpoint set and security matchers.
- Updated the integration test's ambiguous `HttpEntity<>(null)` construction
  introduced by the Spring Framework 7 API.
- Updated Docker, CI, and README Java/Spring Boot version references.

No application business logic or authorization rules were changed. The
existing security matcher chain remains intact, including public health/info
access and admin-only access to the remaining Actuator endpoints.

## Dependency compatibility

The application uses Jackson 3 as the default Boot JSON implementation.
Some third-party libraries still bring Jackson 2 transitively (including
springdoc's YAML/JSR310 support and JJWT's Jackson integration). No
application source usage required those Jackson 2 APIs, and no forced Jackson
2 override was added.

No dependency was found that blocked the Boot 4 migration. JaCoCo 0.8.12
supports the Java 21 build and was retained; the existing 0.80 bundle line
coverage rule was not lowered and no exclusions were added.

## Verification

Final Maven verification:

```text
mvn -B clean verify
Tests run: 763, Failures: 0, Errors: 0, Skipped: 5
All coverage checks have been met.
BUILD SUCCESS
```

JaCoCo reported 4,576 covered of 5,482 total lines, or 83.47% line
coverage.

The dev profile was started with:

```text
mvn -B spring-boot:run -Dspring-boot.run.profiles=dev
```

The application logged `Started KamyaabiApplication` on port 8080. Endpoint
checks returned:

- `/actuator/health`: HTTP 503 because the optional mail health contributor was
  down without configured SMTP credentials; database, disk, email provider,
  liveness, readiness, ping, and SSL contributors initialized successfully.
- `/api-docs`: HTTP 200 with an OpenAPI 3.1.0 document.

The application process was stopped after the checks.
