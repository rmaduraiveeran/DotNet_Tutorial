/* Day 21: Week 3 Project — Full-Stack API */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[21] = {
  html: `
<p>Project day. You will ship a production-shaped REST API for the task tracker &mdash; EF Core persistence, JWT auth, validation, OpenAPI, and integration tests. Budget 2 hours.</p>

<h2>The architecture you are assembling</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 240" width="820" height="240" role="img" aria-label="Full-stack API architecture">
  <defs><marker id="d21a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="30" y="30" width="170" height="60" rx="10" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/>
  <text x="115" y="55" text-anchor="middle" class="dg-text">Clients</text><text x="115" y="73" text-anchor="middle" class="dg-sub">Blazor UI &middot; Swagger</text>
  <rect x="280" y="30" width="220" height="60" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/>
  <text x="390" y="50" text-anchor="middle" class="dg-text">ASP.NET Core API</text>
  <text x="390" y="68" text-anchor="middle" class="dg-sub">JWT &middot; validation &middot; OpenAPI</text>
  <rect x="570" y="30" width="220" height="60" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/>
  <text x="680" y="50" text-anchor="middle" class="dg-text">Domain services</text>
  <text x="680" y="68" text-anchor="middle" class="dg-sub">TaskService &middot; policies</text>
  <rect x="280" y="150" width="220" height="60" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/>
  <text x="390" y="170" text-anchor="middle" class="dg-text">EF Core + SQLite</text>
  <text x="390" y="188" text-anchor="middle" class="dg-sub">migrations &middot; owned by this app</text>
  <rect x="570" y="150" width="220" height="60" rx="10" fill="#fdecec" stroke="#dc2626" stroke-width="1.4"/>
  <text x="680" y="170" text-anchor="middle" class="dg-text">Identity tables</text>
  <text x="680" y="188" text-anchor="middle" class="dg-sub">users &middot; hashed passwords</text>
  <line x1="200" y1="60" x2="278" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d21a)"/>
  <line x1="500" y1="60" x2="568" y2="60" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d21a)"/>
  <line x1="390" y1="90" x2="390" y2="148" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d21a)"/>
  <line x1="680" y1="90" x2="680" y2="148" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d21a)"/>
</svg>
</div>

<h2>Project layout</h2>
<div class="codeblock"><div class="codeblock-header">solution structure</div><pre><code>dotnet new sln -n TaskTracker
dotnet new webapi  -n TaskTracker.Api
dotnet new xunit   -n TaskTracker.Api.Tests
dotnet new classlib -n TaskTracker.Domain
dotnet sln add **/*.csproj

TaskTracker.Domain/        # entities + interfaces (no dependencies!)
TaskTracker.Api/           # EF Core, endpoints, auth, Program.cs
TaskTracker.Api.Tests/     # integration tests via WebApplicationFactory</code></pre></div>

<h2>Endpoints contract (build to this)</h2>
<div class="table-wrap"><table>
<thead><tr><th>Method + Route</th><th>Auth</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>POST /auth/register</code></td><td>anon</td><td>email + password &rarr; 201</td></tr>
<tr><td><code>POST /auth/login</code></td><td>anon</td><td>&rarr; 200 + JWT</td></tr>
<tr><td><code>GET /api/tasks?page=</code></td><td>JWT</td><td>paged, current user only</td></tr>
<tr><td><code>POST /api/tasks</code></td><td>JWT</td><td>201 + Location, validated body</td></tr>
<tr><td><code>PUT /api/tasks/{id}/complete</code></td><td>JWT</td><td>404 if missing, 403 if not yours</td></tr>
<tr><td><code>DELETE /api/tasks/{id}</code></td><td>Admin role</td><td>204 / 403 / 404</td></tr>
</tbody></table></div>

<h2>Step 1 &mdash; EF Core model + migration</h2>
<div class="codeblock"><div class="codeblock-header">Domain + persistence</div><pre><code>// TaskTracker.Domain/TaskItem.cs &mdash; pure, no EF attributes:
public class TaskItem
{
    public int Id { get; set; }
    public string OwnerId { get; set; } = "";       // Identity user id
    public string Title { get; set; } = "";
    public Priority Priority { get; set; }
    public bool IsDone { get; set; }
    public DateTime CreatedUtc { get; set; }
}

// TaskTracker.Api/AppDbContext.cs:
public class AppDbContext(DbContextOptions&lt;AppDbContext&gt; o) : DbContext(o)
{
    public DbSet&lt;TaskItem&gt; Tasks =&gt; Set&lt;TaskItem&gt;();
    protected override void OnModelCreating(ModelBuilder mb) =&gt;
        mb.Entity&lt;TaskItem&gt;().HasIndex(t =&gt; new { t.OwnerId, t.IsDone });
}

// terminal:
// dotnet ef migrations add Init -p TaskTracker.Api
// dotnet ef database update -p TaskTracker.Api</code></pre></div>

<h2>Step 2 &mdash; wire auth, DI, endpoints</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs (essentials)</div><pre><code>builder.Services.AddDbContext&lt;AppDbContext&gt;(o =&gt; o.UseSqlite("Data Source=tasks.db"));
builder.Services.AddScoped&lt;ITaskService, TaskService&gt;();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(/* day 20 */);
builder.Services.AddAuthorizationBuilder().AddPolicy("Admin", p =&gt; p.RequireRole("Admin"));

var app = builder.Build();
app.UseAuthentication(); app.UseAuthorization();

app.MapPost("/api/tasks", async (CreateTaskRequest r, ITaskService svc, ClaimsPrincipal user) =&gt;
{
    var created = await svc.CreateAsync(user.UserId(), r);
    return Results.Created($"/api/tasks/{created.Id}", created);
}).RequireAuthorization();

app.Run();   // &mdash; plus the extension: user.UserId() reads the &ldquo;sub&rdquo; claim</code></pre></div>

<h2>Step 3 &mdash; integration test the whole stack</h2>
<div class="codeblock"><div class="codeblock-header">TaskApiTests.cs</div><pre><code>public class TaskApiTests(WebApplicationFactory&lt;Program&gt; factory)
    : IClassFixture&lt;WebApplicationFactory&lt;Program&gt;&gt;
{
    [Fact]
    public async Task Create_WithoutToken_Returns401()
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/tasks", new { title = "x" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task FullFlow_Register_Login_Create_List()
    {
        var client = factory.CreateClient();
        await client.PostAsJsonAsync("/auth/register", new { email = "a@b.c", password = "Passw0rd!" });
        var login = await client.PostAsJsonAsync("/auth/login", new { email = "a@b.c", password = "Passw0rd!" });
        var jwt = await login.Content.ReadFromJsonAsync&lt;TokenResponse&gt;();

        client.DefaultRequestHeaders.Authorization = new("Bearer", jwt!.AccessToken);
        var created = await client.PostAsJsonAsync("/api/tasks", new { title = "capstone", priority = "high" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var list = await client.GetFromJsonAsync&lt;List&lt;TaskDto&gt;&gt;("/api/tasks");
        Assert.Single(list!);
    }
}</code></pre></div>

<h2>Definition of done</h2>
<ul>
  <li>&#9633; All six endpoints return the contracted status codes.</li>
  <li>&#9633; Users see only their own tasks (filter by claim &mdash; tested).</li>
  <li>&#9633; OpenAPI documents every endpoint and status code.</li>
  <li>&#9633; <code>dotnet test</code> green: at least 6 integration tests, one per flow.</li>
  <li>&#9633; README with run instructions (git init &amp; commit &mdash; this is a portfolio piece).</li>
</ul>
<div class="callout tip"><div class="co-title">Stretch</div><p>Rate-limit with <code>AddRateLimiter</code>, add an <code>Etag</code> concurrency check on updates, or deploy the whole thing to Azure App Service / a Linux container &mdash; Day 26 will give you the Dockerfile pattern for free.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Domain layer stays dependency-free; the API project composes it.</li>
  <li>EF migrations make schema a CI/CD concern, not a manual step.</li>
  <li>Integration tests via WebApplicationFactory catch what units cannot.</li>
  <li>This project is a job-interview artifact &mdash; keep improving it.</li>
</ul>
`
};
