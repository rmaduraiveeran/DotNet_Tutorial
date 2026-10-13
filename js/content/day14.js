/* Day 14: Dependency Injection & Configuration */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[14] = {
  html: `
<p>Dependency Injection is the .NET platform's built-in architecture pattern: classes declare what they <em>need</em>; a container builds them and hands them over. Every ASP.NET Core, Worker, and MAUI app uses it from line one.</p>

<h2>The problem: new is glue</h2>
<div class="codeblock"><div class="codeblock-header">Tightly coupled (hard to test, hard to change)</div><pre><code>public class OrderService
{
    private readonly SqlOrderRepository _repo = new();      // hard-coded
    private readonly SmtpEmailSender _email = new();        // hard-coded
    // Untestable without a real DB and a real SMTP server.
}</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Injected (loose, testable)</div><pre><code>public class OrderService(IOrderRepository repo, IEmailSender email)
{
    // Depends on abstractions; implementations arrive from outside.
}

// Composition root &mdash; the ONE place that knows concrete types:
var services = new ServiceCollection();
services.AddSingleton&lt;IOrderRepository, SqlOrderRepository&gt;();
services.AddScoped&lt;IEmailSender, SmtpEmailSender&gt;();
services.AddScoped&lt;OrderService&gt;();

using var provider = services.BuildServiceProvider();
var svc = provider.GetRequiredService&lt;OrderService&gt;();</code></pre></div>

<h2>The three lifetimes</h2>
<div class="table-wrap"><table>
<thead><tr><th>Lifetime</th><th>One instance per&hellip;</th><th>Typical use</th></tr></thead>
<tbody>
<tr><td><strong>Singleton</strong></td><td>application</td><td>stateless services, caches, configuration</td></tr>
<tr><td><strong>Scoped</strong></td><td>request / unit-of-work</td><td>DbContext, per-request state</td></tr>
<tr><td><strong>Transient</strong></td><td>resolution</td><td>lightweight, stateless helpers</td></tr>
</tbody></table></div>
<div class="callout danger"><div class="co-title">The captive dependency bug</div><p>A Singleton that depends on a Scoped service keeps it alive forever &mdash; the DbContext is then shared across requests (race conditions, stale data). The container detects this and throws in development. Rule: <strong>a longer lifetime may never depend on a shorter one.</strong></p></div>
<div class="diagram-wrap">
<svg viewBox="0 0 820 170" width="820" height="170" role="img" aria-label="DI lifetimes">
  <rect x="30" y="30" width="230" height="110" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/>
  <text x="145" y="55" text-anchor="middle" class="dg-text">Singleton</text>
  <text x="145" y="75" text-anchor="middle" class="dg-sub">1 instance for the app</text>
  <rect x="290" y="30" width="230" height="110" rx="10" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="405" y="55" text-anchor="middle" class="dg-text">Scoped</text>
  <text x="405" y="75" text-anchor="middle" class="dg-sub">1 per request</text>
  <rect x="550" y="30" width="240" height="110" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/>
  <text x="670" y="55" text-anchor="middle" class="dg-text">Transient</text>
  <text x="670" y="75" text-anchor="middle" class="dg-sub">new one each time</text>
  <text x="410" y="160" text-anchor="middle" class="dg-sub">arrow of dependency must point from longer-lived &rarr; shorter-lived, never backwards</text>
</svg>
</div>

<h2>Configuration: the options pattern</h2>
<p><code>appsettings.json</code>, environment variables, and command-line args all flow into one configuration system, strongest last:</p>
<div class="codeblock"><div class="codeblock-header">appsettings.json &rarr; strongly-typed options</div><pre><code>{
  "Smtp": { "Host": "smtp.example.com", "Port": 587, "From": "noreply@example.com" }
}</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Program.cs</div><pre><code>public class SmtpOptions
{
    public string Host { get; init; } = "";
    public int Port { get; init; }
    public string From { get; init; } = "";
}

builder.Services.Configure&lt;SmtpOptions&gt;(builder.Configuration.GetSection("Smtp"));

// Consumers get it injected &mdash; validated, typed, hot-reloadable:
public class EmailSender(IOptions&lt;SmtpOptions&gt; options)
{
    private SmtpOptions Opts =&gt; options.Value;
    public Task SendAsync(string to) =&gt; SendTo(Opts.Host, Opts.Port, Opts.From, to);
}</code></pre></div>

<h2>Service provider internals, briefly</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 130" width="820" height="130" role="img" aria-label="How the container resolves a graph">
  <defs><marker id="d14a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="40" width="180" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="110" y="60" text-anchor="middle" class="dg-text">GetRequiredService</text><text x="110" y="76" text-anchor="middle" class="dg-sub">ask for OrderService</text>
  <rect x="300" y="40" width="220" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="410" y="60" text-anchor="middle" class="dg-text">Container walks graph</text><text x="410" y="76" text-anchor="middle" class="dg-sub">ctor params &rarr; registrations</text>
  <rect x="620" y="40" width="180" height="50" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="710" y="60" text-anchor="middle" class="dg-text">Instance graph built</text><text x="710" y="76" text-anchor="middle" class="dg-sub">lifetimes honored</text>
  <line x1="200" y1="65" x2="298" y2="65" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d14a)"/>
  <line x1="520" y1="65" x2="618" y2="65" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d14a)"/>
</svg>
</div>
<p>The container reflects over constructors, resolves each parameter recursively, caches per lifetime, and disposes <code>IDisposable</code> services it created when their scope ends. You never call <code>new</code> on a service with dependencies &mdash; the container composes the graph.</p>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (30 min)</div>
<p>Wire the Day 13 architecture into DI: <code>IFileSink</code> as singleton, <code>TaskStore</code> as singleton, a new <code>ReportService</code> as scoped, plus <code>SmtpOptions</code> bound from JSON with validation (host non-empty, port 1&ndash;65535 &mdash; fail startup if wrong). Resolve everything from a <code>ServiceProvider</code> in the console app's composition root.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Classes declare needs (constructor parameters); the container supplies them.</li>
  <li>Lifetimes are a contract: singleton &gt; scoped &gt; transient, never reversed.</li>
  <li>Options pattern = typed, validated, reloadable configuration.</li>
  <li>The composition root is the only place that knows concrete types.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Register the same interface twice (two implementations) and consume <code>IEnumerable&lt;IFileSink&gt;</code>.</li><li>Add <code>IOptionsMonitor&lt;SmtpOptions&gt;</code> hot-reload: change JSON at run time, log the change.</li><li>Write a test asserting the DI container throws for captive dependency (Singleton &rarr; Scoped).</li></ul>
`,
  quiz: [
    {
      "q": "The captive dependency bug is…",
      "a": [
        "A DI memory leak",
        "A Singleton depending on a Scoped service",
        "A wrong namespace",
        "A NuGet conflict"
      ],
      "correct": 1,
      "expl": "Longer lifetimes must never depend on shorter ones."
    },
    {
      "q": "One DbContext instance per HTTP request = which lifetime?",
      "a": [
        "Singleton",
        "Scoped",
        "Transient",
        "Static"
      ],
      "correct": 1,
      "expl": "Scoped — created per request, disposed at its end."
    },
    {
      "q": "IOptions<SmtpOptions> gives you…",
      "a": [
        "JSON only",
        "Typed, validated, hot-reloadable configuration",
        "Encryption",
        "Per-tenant config"
      ],
      "correct": 1,
      "expl": "The options pattern binds config sections to types."
    },
    {
      "q": "The composition root is…",
      "a": [
        "Program.cs's Main",
        "The single place that maps abstractions to implementations",
        "The appsettings file",
        "The container itself"
      ],
      "correct": 1,
      "expl": "Everything else asks for interfaces; one place decides concretions."
    }
  ]

};