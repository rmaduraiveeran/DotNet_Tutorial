/* Day 26: Cloud-Native .NET & Docker */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[26] = {
  html: `
<p>Cloud-native means: containers, health probes, centralized logs/metrics, graceful scale-out. .NET 8 is designed for this out of the box &mdash; today you containerize the tracker and add production observability.</p>

<h2>A production Dockerfile</h2>
<div class="codeblock"><div class="codeblock-header">Dockerfile &mdash; multi-stage</div><pre><code>FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TaskTracker.Api/TaskTracker.Api.csproj", "TaskTracker.Api/"]
RUN dotnet restore "TaskTracker.Api/TaskTracker.Api.csproj"
COPY . .
RUN dotnet publish "TaskTracker.Api" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskTracker.Api.dll"]</code></pre></div>
<div class="callout note"><div class="co-title">Why multi-stage</div><p>The SDK image (~700 MB) exists only at build time; the final image is the small aspnet runtime (~110 MB). Layer caching means <code>restore</code> runs only when the csproj changes &mdash; incremental builds stay fast.</p></div>

<h2>Health checks: Kubernetes-ready</h2>
<div class="codeblock"><div class="codeblock-header">Liveness + readiness</div><pre><code>builder.Services.AddHealthChecks()
    .AddDbContextCheck&lt;AppDbContext&gt;("database")
    .AddUrlGroup(new Uri("https://orders:5001/health"), "orders-api");

app.MapHealthChecks("/health/live");                       // is the process up?
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = r =&gt; r.Tags.Contains("ready")               // are deps up?
});</code></pre></div>
<ul>
  <li><strong>Liveness</strong>: process alive? If failing, the orchestrator restarts the container.</li>
  <li><strong>Readiness</strong>: dependencies reachable? If failing, traffic stops <em>without</em> restart.</li>
</ul>

<h2>Observability: OpenTelemetry everywhere</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs &mdash; logs, traces, metrics in one setup</div><pre><code>builder.Services.AddOpenTelemetry()
    .ConfigureResource(r =&gt; r.AddService("TaskTracker.Api"))
    .WithTracing(t =&gt; t
        .AddAspNetCoreInstrumentation()      // every HTTP request = a span
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter())                   // &rarr; collector &rarr; Jaeger/App Insights
    .WithMetrics(m =&gt; m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()          // GC, thread pool, exceptions
        .AddOtlpExporter());</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 170" width="820" height="170" role="img" aria-label="Telemetry pipeline">
  <defs><marker id="d26a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="55" width="180" height="60" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="110" y="80" text-anchor="middle" class="dg-text">Your services</text><text x="110" y="98" text-anchor="middle" class="dg-sub">OTLP over gRPC</text>
  <rect x="290" y="55" width="160" height="60" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="370" y="80" text-anchor="middle" class="dg-text">OTel Collector</text><text x="370" y="98" text-anchor="middle" class="dg-sub">buffer &middot; batch &middot; route</text>
  <rect x="540" y="20" width="250" height="40" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="665" y="45" text-anchor="middle" class="dg-sub">Traces &rarr; Jaeger / App Insights</text>
  <rect x="540" y="70" width="250" height="40" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="665" y="95" text-anchor="middle" class="dg-sub">Metrics &rarr; Prometheus / Grafana</text>
  <rect x="540" y="120" width="250" height="40" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="665" y="145" text-anchor="middle" class="dg-sub">Logs &rarr; Loki / Seq / ELK</text>
  <line x1="200" y1="85" x2="288" y2="85" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26a)"/>
  <line x1="450" y1="75" x2="538" y2="45" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26a)"/>
  <line x1="450" y1="85" x2="538" y2="90" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26a)"/>
  <line x1="450" y1="95" x2="538" y2="135" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26a)"/>
</svg>
</div>

<h2>Configuration for containers</h2>
<div class="codeblock"><div class="codeblock-header">12-factor: config via environment</div><pre><code># All of these override appsettings.json automatically:
docker run -e ASPNETCORE_ENVIRONMENT=Production \
           -e ConnectionStrings__Default="Host=db;Database=tasks" \
           -e Jwt__Key="$JWT_KEY" \
           -p 8080:8080 tasktracker:latest

# docker-compose for local dev (app + database + collector):
services:
  api:
    build: .
    depends_on: [db]
    environment: [ASPNETCORE_ENVIRONMENT=Development]
  db:
    image: postgres:16
# The SAME image runs in dev, CI, staging &mdash; only env differs.</code></pre></div>

<h2>The deployment story end to end</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 120" width="820" height="120" role="img" aria-label="CI/CD pipeline">
  <defs><marker id="d26b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="35" width="150" height="50" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="55" text-anchor="middle" class="dg-text">git push</text><text x="95" y="71" text-anchor="middle" class="dg-sub">CI starts</text>
  <rect x="220" y="35" width="150" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="295" y="55" text-anchor="middle" class="dg-text">dotnet test</text><text x="295" y="71" text-anchor="middle" class="dg-sub">gates the build</text>
  <rect x="420" y="35" width="150" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="495" y="55" text-anchor="middle" class="dg-text">docker build</text><text x="495" y="71" text-anchor="middle" class="dg-sub">one immutable image</text>
  <rect x="620" y="35" width="180" height="50" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="710" y="55" text-anchor="middle" class="dg-text">Deploy (K8s/App Service)</text><text x="710" y="71" text-anchor="middle" class="dg-sub">rolling, health-gated</text>
  <line x1="170" y1="60" x2="218" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26b)"/>
  <line x1="370" y1="60" x2="418" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26b)"/>
  <line x1="570" y1="60" x2="618" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d26b)"/>
</svg>
</div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (40 min)</div>
<p>Containerize the Day 21 API (multi-stage, non-root user via <code>USER app</code>), add both health checks plus OpenTelemetry with console exporter, and write a docker-compose that runs API + SQLite volume. Then <code>docker run</code> it, watch traces print, kill the DB and confirm readiness fails while liveness stays green.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Multi-stage Dockerfiles: SDK builds, runtime ships.</li>
  <li>Liveness vs readiness answer different questions &mdash; expose both.</li>
  <li>OpenTelemetry instruments once, exports to any backend.</li>
  <li>Config through environment; one image, many environments.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add a <code>Prometheus</code> scraping endpoint (<code>MapPrometheusScrapingEndpoint</code>) and graph request latency.</li><li>Make the container run as non-root with a read-only filesystem &mdash; fix what breaks.</li><li>Add <code>OTEL_EXPORTER_OTLP_ENDPOINT</code> to compose with a Jaeger all-in-one container; trace one request end-to-end.</li></ul>
`,
  quiz: [
    {
      "q": "Multi-stage Dockerfiles exist to…",
      "a": [
        "Look advanced",
        "Build with the SDK image, ship only the small runtime image",
        "Cache layers",
        "Support Windows"
      ],
      "correct": 1,
      "expl": "~700MB SDK at build; ~110MB aspnet runtime in the final image."
    },
    {
      "q": "Liveness vs readiness probes:",
      "a": [
        "Identical",
        "Liveness = restart me; readiness = stop sending traffic",
        "Readiness restarts",
        "Only K8s uses one"
      ],
      "correct": 1,
      "expl": "Failing readiness ≠ crash loop; failing liveness = restart."
    },
    {
      "q": "OpenTelemetry gives you…",
      "a": [
        "Logs only",
        "Vendor-neutral traces + metrics + logs with one instrumentation API",
        "Alerts",
        "Dashboards"
      ],
      "correct": 1,
      "expl": "Instrument once, export to any backend."
    },
    {
      "q": "12-factor config means…",
      "a": [
        "appsettings.json in the image",
        "Environment variables/secret stores injected at deploy time",
        "Hardcoded defaults",
        "Config in code"
      ],
      "correct": 1,
      "expl": "One image, many environments — only env differs."
    }
  ]

};