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
<h3>Token lifetimes: short access + refresh</h3>
<p>A stolen JWT is valid until it expires &mdash; there is no server-side revoke without extra machinery. The standard mitigation is a <strong>pair</strong>: access token lives 5&ndash;15 minutes; refresh token lives days, is stored server-side (hash + device), and can be individually revoked. Clients call <code>/auth/refresh</code> when the access token dies.</p>
<div class="codeblock"><div class="codeblock-header">TokenService.cs &mdash; issuing claims the right way</div><pre><code>public string CreateAccessToken(IdentityUser user, IEnumerable&lt;string&gt; roles)
{
    var claims = new List&lt;Claim&gt;
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),        // subject = stable user id
        new(JwtRegisteredClaimNames.Email, user.Email!),
        // put roles in the token &rarr; no DB hit to authorize; revocation lag = token lifetime
    };
    claims.AddRange(roles.Select(r =&gt; new Claim(ClaimTypes.Role, r)));

    var creds = new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)),
        SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: config["Jwt:Issuer"],          // who made it (validated later)
        audience: config["Jwt:Audience"],      // who it is FOR (validated later)
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(15),
        signingCredentials: creds);

    return new JwtSecurityTokenHandler().WriteToken(token);
}</code></pre></div>
<div class="callout warning"><div class="co-title">JWT storage on the client &mdash; the honest tradeoffs</div><p><strong>localStorage</strong>: survives tabs, but any XSS steals it. <strong>HttpOnly cookie</strong>: JS cannot read it (XSS-safe), but CSRF returns &mdash; use <code>SameSite=Strict/Lax</code> + anti-forgery. <strong>In-memory (SPA)</strong>: safest, lost on refresh &mdash; pair with the refresh token in an HttpOnly cookie. There is no free lunch; pick per threat model, never default to localStorage for production.</p></div>

<h2>OpenID Connect: delegating login to the pros</h2>
<p>For &ldquo;Sign in with Microsoft/Google&rdquo; or enterprise SSO, your app becomes an OIDC <em>client</em>: it redirects to the identity provider, receives back a signed <code>id_token</code> (authentication) + optionally <code>access_token</code> (calling other APIs). OAuth2 = authorization framework; OIDC = the identity layer on top. You never see passwords &mdash; MFA, account risk, and compliance live with the IdP.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 860 180" width="860" height="180" role="img" aria-label="OIDC authorization code flow">
  <defs><marker id="d20c" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="60" width="150" height="56" rx="8" fill="#f1f3f5" stroke="#8a919e"/><text x="95" y="83" text-anchor="middle" class="dg-text">Browser</text><text x="95" y="101" text-anchor="middle" class="dg-sub">your app&rsquo;s UI</text>
  <rect x="340" y="60" width="180" height="56" rx="8" fill="#efedfd" stroke="#6c5ce7"/><text x="430" y="83" text-anchor="middle" class="dg-text">Your app (client)</text><text x="430" y="101" text-anchor="middle" class="dg-sub">OIDC handler</text>
  <rect x="640" y="60" width="190" height="56" rx="8" fill="#e7f8f1" stroke="#0e9f6e"/><text x="735" y="83" text-anchor="middle" class="dg-text">Identity Provider</text><text x="735" y="101" text-anchor="middle" class="dg-sub">Entra / Duende / Keycloak</text>
  <text x="255" y="40" text-anchor="middle" class="dg-sub">1. login? &rarr; 302 to IdP</text>
  <text x="570" y="40" text-anchor="middle" class="dg-sub">2. user authenticates at IdP</text>
  <text x="565" y="150" text-anchor="middle" class="dg-sub">3. redirect back with code &rarr; app exchanges code for tokens (server-to-server)</text>
  <line x1="170" y1="75" x2="338" y2="75" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d20c)"/>
  <line x1="520" y1="75" x2="638" y2="75" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d20c)"/>
  <path d="M 735 118 Q 735 160 430 160 Q 190 160 130 120" fill="none" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d20c)"/>
</svg>
</div>
<div class="codeblock"><div class="codeblock-header">Oidc.cs &mdash; the whole setup</div><pre><code>builder.Services.AddAuthentication(o =&gt; { o.DefaultScheme = "Cookies"; o.DefaultChallengeScheme = "oidc"; })
    .AddCookie("Cookies")
    .AddOpenIdConnect("oidc", o =&gt;
    {
        o.Authority = "https://idp.example.com";     // discovers endpoints from here
        o.ClientId = "web"; o.ClientSecret = "secret";
        o.ResponseType = "code";                      // authorization code flow &mdash; always
        o.SaveTokens = true;                          // tokens available via IUserAccessTokenProvider
    });</code></pre></div>

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

<h2>Beyond roles: resource-based and custom authorization</h2>
<p>Roles and claims answer &ldquo;what kind of user is this?&rdquo; &mdash; but real rules are about <em>specific resources</em>: &ldquo;can this user edit <em>this</em> task?&rdquo; That is an <code>IAuthorizationHandler</code>.</p>
<div class="codeblock"><div class="codeblock-header">ResourceAuth.cs &mdash; the full pattern</div><pre><code>// 1. Requirement &mdash; the rule statement (no logic):
public class SameOwnerRequirement : IAuthorizationRequirement { }

// 2. Handler &mdash; the logic, fully unit-testable with zero HTTP involved:
public class SameOwnerHandler : AuthorizationHandler&lt;SameOwnerRequirement, TaskItem&gt;
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, SameOwnerRequirement requirement, TaskItem task)
    {
        var userId = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId == task.OwnerId || context.User.IsInRole("Admin"))
            context.Succeed(requirement);              // mark success; absence = fail
        return Task.CompletedTask;
    }
}
// builder.Services.AddSingleton&lt;IAuthorizationHandler, SameOwnerHandler&gt;();
// builder.Services.AddAuthorizationBuilder()
//     .AddPolicy("OwnsTask", p =&gt; p.Requirements.Add(new SameOwnerRequirement()));

// 3. Use &mdash; in an endpoint with the resource loaded:
app.MapPut("/tasks/{id:int}", async (int id, IAuthorizationService authz,
    ClaimsPrincipal user, ITaskService svc, UpdateTaskRequest req) =&gt;
{
    var task = await svc.GetAsync(id);
    if (task is null) return Results.NotFound();
    var decision = await authz.AuthorizeAsync(user, task, "OwnsTask");
    if (!decision.Succeeded) return Results.Forbid();   // 403 &mdash; authenticated but not allowed
    return Results.Ok(await svc.UpdateAsync(id, req));
}).RequireAuthorization();   // baseline auth + fine-grained check inside</code></pre></div>

<h2>Data Protection: where your &ldquo;secret-ish&rdquo; state gets encrypted</h2>
<div class="codeblock"><div class="codeblock-header">DataProtection.cs &mdash; TempData, auth cookies, anti-forgery all use this</div><pre><code>// ASP.NET Core encrypts/verifies its own state (auth cookies, TempData, anti-forgery
// tokens) through the Data Protection stack. You can use it too:
var provider = app.Services.GetDataProtector("orders.receipts");
var protectedBlob = provider.Protect($"order:{orderId}");     // tamper-proof, auto-expiring
var plain = provider.Unprotect(protectedBlob);

// Key management matters in clusters:
//   keys in %LOCALAPPDATA%/ASP.NET/DataProtection-Keys by default;
//   in multi-instance deployments persist them (Blob storage/RBAC, Redis, cert)
//   or every instance produces its own keys &amp; cookies stop validating across instances.</code></pre></div>

<h2>Security headers &amp; hardening checklist</h2>
<div class="codeblock"><div class="codeblock-header">Hardening.cs</div><pre><code>app.Use(async (ctx, next) =&gt;
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    ctx.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; img-src 'self' data:";
    await next();
});
// Plus: rate limiting (AddRateLimiter), request size caps (Kestrel limits, Day 15),
// HTTPS redirect + HSTS in prod, and NEVER log tokens or passwords (redact in middleware).</code></pre></div>

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
<p>Add auth to the task API: Identity user registration + login issuing short-lived JWTs (15 min) plus a refresh endpoint. <code>[Authorize]</code> on writes, a <code>CanDeleteTasks</code> policy (role Admin), and a <code>SameOwnerHandler</code> so users only see/modify their own tasks &mdash; test the handler as a pure unit test, then through the endpoint. Break the middleware order on purpose (auth after authz) and observe. Inspect a token at jwt.io: find your <code>sub</code>, roles, and <code>exp</code>. Verify 401 vs 403 behavior: no token = 401; someone else's task = 403.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Authenticate (who) before authorize (may) &mdash; in middleware order and in concept.</li>
  <li>JWTs carry claims; short access + revocable refresh is the production pattern.</li>
  <li>Policies centralize rules; resource-based handlers answer &ldquo;may this user touch <em>this</em> object?&rdquo;</li>
  <li>Identity handles password hashing, lockout, 2FA &mdash; never roll your own.</li>
  <li>Delegate login to an IdP (OIDC) when MFA/SSO/enterprise rules are in play.</li>
  <li>Data Protection underpins cookies/anti-forgery; persist keys when clustering.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Implement refresh-token rotation: one-time-use refresh tokens, reuse = revoke all sessions.</li><li>Add a <code>MinimumAgeRequirement</code> (claim dob) with a handler + test.</li><li>Log all failed authorization attempts via an <code>IAuthorizationHandler</code> (middleware-free).</li></ul>
`,
  quiz: [
    {
      "q": "Authentication vs authorization:",
      "a": [
        "Same thing",
        "AuthN = who you are; AuthZ = what you may do",
        "AuthZ first",
        "Only JWT does both"
      ],
      "correct": 1,
      "expl": "UseAuthentication populates the principal; UseAuthorization evaluates it."
    },
    {
      "q": "Short-lived access tokens + refresh tokens exist to…",
      "a": [
        "Save bandwidth",
        "Limit stolen-token blast radius while keeping sessions smooth",
        "Avoid HTTPS",
        "Reduce DB load"
      ],
      "correct": 1,
      "expl": "Access 5-15 min; refresh revocable server-side."
    },
    {
      "q": "'May this user edit THIS task?' is answered by…",
      "a": [
        "RequireRole",
        "A resource-based IAuthorizationHandler",
        "A claim check",
        "The router"
      ],
      "correct": 1,
      "expl": "Resource-based handlers receive the actual entity."
    },
    {
      "q": "401 vs 403:",
      "a": [
        "Same meaning",
        "401 = not authenticated; 403 = authenticated but not allowed",
        "401 = forbidden",
        "403 = not found"
      ],
      "correct": 1,
      "expl": "Anonymous → 401; wrong-owner → 403."
    }
  ]

};