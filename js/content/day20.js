/* Day 20: Authentication & Authorization */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[20] = {
  html: `
<p>Auth has two halves: <strong>authentication</strong> (&ldquo;who are you?&rdquo;) and <strong>authorization</strong> (&ldquo;may you do that?&rdquo;). ASP.NET Core has a unified story for both.</p>

<h2>The authentication landscape</h2>
<div class="table-wrap"><table>
<thead><tr><th>Scheme</th><th>How it works</th><th>Use for</th></tr></thead>
<tbody>
<tr><td><strong>Cookie</strong></td><td>server session ID in an HttpOnly cookie</td><td>MVC/Razor sites, same-origin</td></tr>
<tr><td><strong>JWT Bearer</strong></td><td>signed token in <code>Authorization</code> header</td><td>SPAs, mobile, service-to-service</td></tr>
<tr><td><strong>OpenID Connect</strong></td><td>delegated login to an identity provider</td><td>Google/Azure AD/Entra, SSO</td></tr>
<tr><td><strong>API key</strong></td><td>static key per client</td><td>machine-to-machine, low trust</td></tr>
</tbody></table></div>

<h2>JWT, demystified</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="JWT structure and flow">
  <defs><marker id="d20a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="30" width="230" height="40" rx="6" fill="#efedfd" stroke="#6c5ce7"/><text x="135" y="55" text-anchor="middle" class="dg-sub">header.payload.signature</text>
  <rect x="20" y="85" width="75" height="36" rx="6" fill="#e7f8f1" stroke="#0e9f6e"/><text x="57" y="107" text-anchor="middle" class="dg-sub">alg+type</text>
  <rect x="103" y="85" width="147" height="36" rx="6" fill="#fef3e2" stroke="#d97706"/><text x="176" y="107" text-anchor="middle" class="dg-sub">claims (sub, role, exp)</text>
  <text x="300" y="55" class="dg-text">Flow:</text>
  <text x="300" y="80" class="dg-sub">1. User logs in &rarr; server signs token with a secret/key</text>
  <text x="300" y="98" class="dg-sub">2. Client sends token on every request</text>
  <text x="300" y="116" class="dg-sub">3. Server verifies signature &mdash; no session storage needed</text>
  <text x="300" y="134" class="dg-sub">Trade-off: token content is readable &mdash; put nothing secret inside</text>
</svg>
</div>

<h2>Securing a minimal API</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs &mdash; JWT bearer</div><pre><code>using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =&gt; o.TokenValidationParameters = new()
    {
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),   // &gt; 32 chars
    });

builder.Services.AddAuthorization();          // policy engine

// Policies &mdash; authorization as data, not scattered checks:
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanDeleteOrders", p =&gt; p.RequireRole("Admin"))
    .AddPolicy("PremiumUsers", p =&gt; p.RequireClaim("tier", "premium"));

var app = builder.Build();
app.UseAuthentication();      // who are you?   (must be first)
app.UseAuthorization();       // may you?       (second)

app.MapGet("/admin/dashboard", () =&gt; "secret")
   .RequireAuthorization("CanDeleteOrders");          // endpoint-level policy

app.MapPost("/orders", async (Order o, ClaimsPrincipal user) =&gt;
{
    var name = user.Identity?.Name ?? "anonymous";    // authenticated by middleware
    /* ... */
}).RequireAuthorization();

app.Run();</code></pre></div>
<div class="callout danger"><div class="co-title">Order matters</div><p><code>UseAuthentication</code> must precede <code>UseAuthorization</code> &mdash; the auth middleware populates <code>ClaimsPrincipal</code> that the authz middleware then evaluates. Swapped, everything is &ldquo;unauthenticated&rdquo;.</p></div>

<h2>ASP.NET Core Identity: users done right</h2>
<p>Never store passwords yourself. <code>AddIdentityCore&lt;TUser&gt;()</code> gives you hashed passwords (PBKDF2), lockout, email confirmation, and 2FA out of the box &mdash; backed by your EF Core database.</p>
<div class="codeblock"><div class="codeblock-header">Identity setup</div><pre><code>builder.Services.AddIdentityCore&lt;IdentityUser&gt;(o =&gt;
    {
        o.Password.RequireNonAlphanumeric = false;
        o.Lockout.MaxFailedAccessAttempts = 5;
    })
    .AddEntityFrameworkStores&lt;AppDbContext&gt;();    // AspNetUsers table

// Login &rarr; verify hash &rarr; issue JWT:
var result = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
if (result.Succeeded) return Ok(await GenerateJwtAsync(user));</code></pre></div>

<h2>The authorization decision flow</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 120" width="820" height="120" role="img" aria-label="Authorization flow">
  <defs><marker id="d20b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="38" width="150" height="44" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="58" text-anchor="middle" class="dg-text">Request</text><text x="95" y="74" text-anchor="middle" class="dg-sub">+ token/cookie</text>
  <rect x="230" y="38" width="170" height="44" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="315" y="58" text-anchor="middle" class="dg-text">Authenticate</text><text x="315" y="74" text-anchor="middle" class="dg-sub">&rarr; ClaimsPrincipal</text>
  <rect x="460" y="38" width="160" height="44" rx="8" fill="#fef3e2" stroke="#d97706"/><text x="540" y="58" text-anchor="middle" class="dg-text">Policy eval</text><text x="540" y="74" text-anchor="middle" class="dg-sub">roles, claims, requirements</text>
  <rect x="670" y="20" width="130" height="34" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="735" y="43" text-anchor="middle" class="dg-sub">endpoint runs</text>
  <rect x="670" y="66" width="130" height="34" rx="8" fill="#fdecec" stroke="#dc2626"/><text x="735" y="89" text-anchor="middle" class="dg-sub">401 / 403</text>
  <line x1="170" y1="60" x2="228" y2="60" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d20b)"/>
  <line x1="400" y1="60" x2="458" y2="60" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d20b)"/>
  <line x1="620" y1="52" x2="668" y2="40" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d20b)"/>
  <line x1="620" y1="68" x2="668" y2="82" stroke="#8a919e" stroke-width="1.4" marker-end="url(#d20b)"/>
</svg>
</div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Add auth to the task API: Identity user registration + login issuing JWTs, <code>[Authorize]</code> on writes, a <code>CanDeleteTasks</code> policy (role Admin), and ownership filtering so users only see their own tasks (custom claim &rarr; query filter). Test with Swagger: obtain a token, click Authorize, watch 401s turn to 200s.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Authenticate (who) before authorize (may).</li>
  <li>JWTs carry claims; no server-side session required.</li>
  <li>Policies centralize rules; apply per endpoint, not per controller.</li>
  <li>Identity handles password hashing, lockout, 2FA &mdash; never roll your own.</li>
</ul>
`
};
