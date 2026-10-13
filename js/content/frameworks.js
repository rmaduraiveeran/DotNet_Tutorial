/* Framework Comparison deep-dive content */
window.FRAMEWORKS_CONTENT = {
  title: "Framework Comparison: .NET Framework vs .NET Core vs Modern .NET",
  html: `
<p class="lede">If you read older tutorials or job posts you will see three names used almost interchangeably: <strong>.NET Framework</strong>, <strong>.NET Core</strong>, and <strong>.NET 5+ (modern .NET)</strong>. They are not the same product, they are <em>generations</em> of the same platform. This guide untangles them with a timeline, side-by-side code, and a decision guide.</p>

<div class="callout note"><div class="co-title">&#129513; The naming in one sentence</div><p>.NET Framework is the original Windows-only platform (2002, still supported for legacy apps). .NET Core was the open-source, cross-platform rewrite (2016&ndash;2019). Modern .NET (.NET 5 onward) is simply the <strong>continuation of .NET Core</strong> under a version-agnostic name &mdash; &ldquo;Core&rdquo; was dropped so the version number could keep rising. When someone says &ldquo;.NET&rdquo; today, they mean this one.</p></div>

<h2>The timeline: how we got here</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 860 210" width="860" height="210" role="img" aria-label="Timeline of .NET releases">
  <defs><marker id="fwb-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <line x1="30" y1="105" x2="830" y2="105" stroke="#8a919e" stroke-width="2" marker-end="url(#fwb-arrow)"/>
  <g>
    <circle cx="80" cy="105" r="7" fill="#dc2626"/><text x="80" y="80" text-anchor="middle" class="dg-text">2002</text>
    <text x="80" y="140" text-anchor="middle" class="dg-text">.NET Framework</text><text x="80" y="156" text-anchor="middle" class="dg-sub">1.0 &rarr; 4.8.x (Windows only)</text>
  </g>
  <g>
    <circle cx="270" cy="105" r="7" fill="#d97706"/><text x="270" y="80" text-anchor="middle" class="dg-text">2016</text>
    <text x="270" y="140" text-anchor="middle" class="dg-text">.NET Core</text><text x="270" y="156" text-anchor="middle" class="dg-sub">1.0 &rarr; 3.1 (cross-platform rewrite)</text>
  </g>
  <g>
    <circle cx="470" cy="105" r="7" fill="#2563eb"/><text x="470" y="80" text-anchor="middle" class="dg-text">2020</text>
    <text x="470" y="140" text-anchor="middle" class="dg-text">.NET 5</text><text x="470" y="156" text-anchor="middle" class="dg-sub">Core + Framework APIs unified</text>
  </g>
  <g>
    <circle cx="640" cy="105" r="7" fill="#0e9f6e"/><text x="640" y="80" text-anchor="middle" class="dg-text">2021&ndash;22</text>
    <text x="640" y="140" text-anchor="middle" class="dg-text">.NET 6 / 7</text><text x="640" y="156" text-anchor="middle" class="dg-sub">LTS 6, then 7</text>
  </g>
  <g>
    <circle cx="780" cy="105" r="7" fill="#6c5ce7"/><text x="780" y="80" text-anchor="middle" class="dg-text">2023+</text>
    <text x="780" y="140" text-anchor="middle" class="dg-text">.NET 8 / 9</text><text x="780" y="156" text-anchor="middle" class="dg-sub">LTS 8, Native AOT maturity</text>
  </g>
  <text x="30" y="30" class="dg-sub">One platform, three eras &mdash; .NET Framework froze at 4.8; everything after 2019 is one continuous &ldquo;modern .NET&rdquo; line</text>
</svg>
</div>

<h2>Era 1 &mdash; .NET Framework (2002&ndash;2019, maintenance only)</h2>
<p>The original platform. It shipped as a machine-wide Windows component, bundled the full desktop/ASP.NET/WebForms stacks, and every version replaced the previous one in place. It is now in <strong>maintenance mode</strong>: 4.8.1 is the last major version and it receives security fixes only. You will still meet it in enterprise codebases &mdash; WinForms, WPF, WebForms, WCF, and older ASP.NET MVC 5 apps.</p>
<ul>
  <li><strong>Windows-only</strong>, tied to the OS and IIS for web hosting.</li>
  <li><strong>One big install</strong> &mdash; apps share a machine-wide runtime, which caused the classic &ldquo;DLL hell&rdquo; version conflicts.</li>
  <li><strong>Closed source</strong> (reference source was readable, but it was not an open-source project).</li>
  <li><strong>Tooling</strong> is the old-style <code>.csproj</code> (XML-heavy, GUIDs, explicit file lists) plus <code>packages.config</code> for NuGet.</li>
</ul>

<h2>Era 2 &mdash; .NET Core (2016&ndash;2019)</h2>
<p>A ground-up rewrite of the runtime and libraries, open-sourced on GitHub and designed to run on Windows, Linux, and macOS. It introduced everything that defines modern .NET development: self-contained deployments, side-by-side runtimes, the CLI (<code>dotnet</code> command), SDK-style projects, built-in dependency injection, and a much faster Kestrel web server. Versions 1.0&ndash;3.1 shipped, then the numbering jumped to 5 deliberately.</p>
<div class="callout warning"><div class="co-title">Why the jump from Core 3.1 to .NET 5?</div><p>Two reasons: to avoid confusion with ASP.NET Core&rsquo;s own versioning, and to signal that this single platform is now &ldquo;the&rdquo; .NET &mdash; a version number that never collides with Framework 4.x. .NET Core 3.1 and .NET 5 are the <em>same lineage</em>; 5 is newer.</p></div>

<h2>Era 3 &mdash; Modern .NET (.NET 5 and later)</h2>
<p>From 2020 onward there is exactly <strong>one .NET</strong>. It absorbed the best of Framework&rsquo;s API surface (WinForms and WPF run on it, Windows-only workloads included) while keeping Core&rsquo;s cross-platform, high-performance foundation. Every year in November a new major version ships, with even-numbered releases designated <strong>LTS</strong> (3 years of support) and odd-numbered releases STS (18 months). As of 2026 the supported lines are .NET 8 (LTS) and .NET 9/10.</p>

<div class="table-wrap"><table>
<thead><tr><th>Dimension</th><th>.NET Framework</th><th>.NET Core</th><th>Modern .NET (5+)</th></tr></thead>
<tbody>
<tr><td>Platforms</td><td>Windows only</td><td>Windows, Linux, macOS</td><td>Windows, Linux, macOS (+ Android, iOS via MAUI)</td></tr>
<tr><td>Current status</td><td>Maintenance (4.8.x)</td><td>End of life</td><td>Active &mdash; yearly releases</td></tr>
<tr><td>Open source</td><td>No</td><td>Yes (MIT)</td><td>Yes (MIT)</td></tr>
<tr><td>Deployment</td><td>Machine-wide runtime</td><td>Side-by-side / self-contained</td><td>Side-by-side / self-contained / single-file</td></tr>
<tr><td>Web server</td><td>IIS (System.Web)</td><td>Kestrel + IIS/Nginx</td><td>Kestrel + HTTP/3, minimal APIs</td></tr>
<tr><td>Performance</td><td>Baseline</td><td>Much faster than Framework</td><td>Faster still (Span, Native AOT, SIMD)</td></tr>
<tr><td>App models</td><td>WinForms, WPF, WebForms, MVC 5</td><td>ASP.NET Core, EF Core, console</td><td>All of it: ASP.NET Core, Blazor, MAUI, Orleans, WinForms/WPF</td></tr>
<tr><td>Project file</td><td>Legacy csproj + packages.config</td><td>SDK-style csproj</td><td>SDK-style csproj</td></tr>
<tr><td>DI built in</td><td>No</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Future</td><td>Security fixes only</td><td>Superseded by 5+</td><td>The platform&rsquo;s future</td></tr>
</tbody></table></div>

<h2>Same app, three eras: the code difference</h2>
<p>The fastest way to feel the difference is to build the same &ldquo;hello world&rdquo; web app on each generation.</p>

<h3>Project files: legacy vs SDK-style</h3>
<p>Framework projects listed every file and every assembly reference by hand. SDK-style projects (Core and modern .NET) infer everything from the folder and target framework.</p>
<div class="codeblock"><div class="codeblock-header">.NET Framework &mdash; Legacy.csproj (excerpt)</div><pre><code>&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003"&gt;
  &lt;PropertyGroup&gt;
    &lt;OutputType&gt;Exe&lt;/OutputType&gt;
    &lt;TargetFrameworkVersion&gt;v4.8&lt;/TargetFrameworkVersion&gt;
  &lt;/PropertyGroup&gt;
  &lt;Compile Include="Program.cs" /&gt;
  &lt;Compile Include="Services\OrderService.cs" /&gt;
  &lt;Reference Include="Newtonsoft.Json"&gt;
    &lt;HintPath&gt;..\packages\Newtonsoft.Json.13.0.3\lib\net45\Newtonsoft.Json.dll&lt;/HintPath&gt;
  &lt;/Reference&gt;
  &lt;ItemGroup&gt;
    &lt;None Include="packages.config" /&gt;
  &lt;/ItemGroup&gt;
&lt;/Project&gt;</code></pre></div>

<div class="codeblock"><div class="codeblock-header">Modern .NET &mdash; App.csproj (complete)</div><pre><code>&lt;Project Sdk="Microsoft.NET.Sdk"&gt;

  &lt;PropertyGroup&gt;
    &lt;OutputType&gt;Exe&lt;/OutputType&gt;
    &lt;TargetFramework&gt;net8.0&lt;/TargetFramework&gt;
    &lt;Nullable&gt;enable&lt;/Nullable&gt;
    &lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;
  &lt;/PropertyGroup&gt;

  &lt;ItemGroup&gt;
    &lt;PackageReference Include="Newtonsoft.Json" Version="13.0.3" /&gt;
  &lt;/ItemGroup&gt;

&lt;/Project&gt;

&lt;!-- That is the whole file. Files in the folder are compiled
     automatically, NuGet is declared inline, no packages.config. --&gt;</code></pre></div>

<h3>A web endpoint: ASP.NET (Framework) vs minimal API (modern .NET)</h3>
<div class="codeblock"><div class="codeblock-header">.NET Framework 4.8 &mdash; ASP.NET with controllers + Global.asax + web.config</div><pre><code>// Controllers/ProductsController.cs  (needs IIS, System.Web, web.config, Global.asax routing)
using System.Web.Http;

namespace LegacyApi.Controllers
{
    public class ProductsController : ApiController
    {
        [Route("api/products/{id}")]
        public IHttpActionResult Get(int id)
        {
            return Ok(new { Id = id, Name = "Widget" });
        }
    }
}

/* Plus: WebApiConfig.cs registration, Global.asax startup,
   and a web.config with &lt;system.webServer&gt; handlers.
   Hosting: IIS only. Startup time: seconds. */</code></pre></div>

<div class="codeblock"><div class="codeblock-header">Modern .NET 8 &mdash; Program.cs, complete and runnable</div><pre><code>var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/api/products/{id}", (int id) =&gt; new { Id = id, Name = "Widget" });

app.Run();

// dotnet run &rarr; Kestrel on https://localhost:5001
// No IIS, no config files, no controller ceremony. Runs on Windows, Linux, macOS.
// Can be published as a single ~10 MB self-contained exe, or Native AOT for ~50 ms cold start.</code></pre></div>

<h2>The architecture in one picture</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 860 330" width="860" height="330" role="img" aria-label="Stack comparison of the three .NET generations">
  <defs><marker id="fwb-arrow2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <text x="150" y="26" text-anchor="middle" class="dg-text" fill="#dc2626">.NET Framework</text>
  <text x="430" y="26" text-anchor="middle" class="dg-text" fill="#d97706">.NET Core</text>
  <text x="710" y="26" text-anchor="middle" class="dg-text" fill="#0e9f6e">Modern .NET 5+</text>

  &lt;!-- column headers done; now the stacked layers --&gt;
  <g>
    <rect x="60" y="40" width="180" height="34" rx="6" fill="#fdecec" stroke="#dc2626" stroke-width="1.2"/><text x="150" y="62" text-anchor="middle" class="dg-sub">WinForms &middot; WPF &middot; WebForms</text>
    <rect x="60" y="80" width="180" height="30" rx="6" fill="#fdecec" stroke="#dc2626" stroke-width="1.2"/><text x="150" y="100" text-anchor="middle" class="dg-sub">ASP.NET (MVC 5, Web API 2)</text>
    <rect x="340" y="40" width="180" height="34" rx="6" fill="#fef3e2" stroke="#d97706" stroke-width="1.2"/><text x="430" y="62" text-anchor="middle" class="dg-sub">ASP.NET Core</text>
    <rect x="340" y="80" width="180" height="30" rx="6" fill="#fef3e2" stroke="#d97706" stroke-width="1.2"/><text x="430" y="100" text-anchor="middle" class="dg-sub">EF Core &middot; console apps</text>
    <rect x="620" y="40" width="180" height="34" rx="6" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.2"/><text x="710" y="62" text-anchor="middle" class="dg-sub">ASP.NET Core &middot; Blazor &middot; MAUI</text>
    <rect x="620" y="80" width="180" height="30" rx="6" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.2"/><text x="710" y="100" text-anchor="middle" class="dg-sub">EF Core &middot; Orleans &middot; WinForms/WPF</text>
  </g>
  <g>
    <rect x="60" y="122" width="180" height="30" rx="6" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.2"/><text x="150" y="142" text-anchor="middle" class="dg-sub">.NET Standard 2.0 surface</text>
    <rect x="340" y="122" width="180" height="30" rx="6" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.2"/><text x="430" y="142" text-anchor="middle" class="dg-sub">.NET Standard 2.1 surface</text>
    <rect x="620" y="122" width="180" height="30" rx="6" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.2"/><text x="710" y="142" text-anchor="middle" class="dg-sub">Base Class Library (BCL)</text>
  </g>
  <g>
    <rect x="60" y="160" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="150" y="180" text-anchor="middle" class="dg-sub">CLR (Windows only)</text>
    <rect x="340" y="160" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="430" y="180" text-anchor="middle" class="dg-sub">CoreCLR (Win/Linux/macOS)</text>
    <rect x="620" y="160" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="710" y="180" text-anchor="middle" class="dg-sub">CoreCLR + Native AOT + Mono</text>
  </g>
  <g>
    <rect x="60" y="198" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="150" y="218" text-anchor="middle" class="dg-sub">IIS &middot; Windows services</text>
    <rect x="340" y="198" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="430" y="218" text-anchor="middle" class="dg-sub">Kestrel &middot; self-hosted &middot; Docker</text>
    <rect x="620" y="198" width="180" height="30" rx="6" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.2"/><text x="710" y="218" text-anchor="middle" class="dg-sub">Kestrel &middot; containers &middot; serverless</text>
  </g>
  <line x1="40" y1="245" x2="820" y2="245" stroke="#e3e6ea" stroke-width="1"/>
  <text x="430" y="270" text-anchor="middle" class="dg-sub">.NET Standard was the compatibility contract that let libraries target every generation.</text>
  <text x="430" y="288" text-anchor="middle" class="dg-sub">Modern .NET made it obsolete: net8.0 libraries run everywhere .NET does.</text>
  <text x="430" y="312" text-anchor="middle" class="dg-text">Rule of thumb: netstandard2.0 for max compatibility, net8.0 for modern features</text>
</svg>
</div>

<h2>Which one should you choose?</h2>
<div class="table-wrap"><table>
<thead><tr><th>Situation</th><th>Choose</th><th>Why</th></tr></thead>
<tbody>
<tr><td>New web API, service, or website</td><td><strong>Modern .NET (8/9)</strong></td><td>Minimal APIs, Kestrel, containers, yearly performance wins</td></tr>
<tr><td>New cross-platform UI</td><td><strong>Modern .NET + MAUI/Blazor</strong></td><td>One codebase for Windows, macOS, iOS, Android, web</td></tr>
<tr><td>Existing WinForms/WPF business app</td><td><strong>Migrate to .NET 8</strong></td><td>WinForms/WPF are supported on modern .NET with real performance gains</td></tr>
<tr><td>Legacy WebForms / WCF server</td><td><strong>Stay, then migrate</strong></td><td>No direct successor for WebForms; WCF &rarr; CoreWCF or gRPC</td></tr>
<tr><td>Library consumed by Framework apps</td><td><strong>netstandard2.0</strong></td><td>Runs on Framework, Core, and modern .NET alike</td></tr>
<tr><td>New library for modern apps</td><td><strong>net8.0</strong></td><td>Full API surface, trimming and AOT friendly</td></tr>
</tbody></table></div>

<div class="callout tip"><div class="co-title">Migration path that actually works</div><p>Microsoft&rsquo;s <code>.NET Upgrade Assistant</code> and the <code>try-convert</code> tool convert most projects to SDK-style automatically. The typical order: (1) convert the csproj, (2) fix API changes with the <em>Windows Compatibility Pack</em>, (3) swap packages.config for PackageReference, (4) update third-party dependencies to .NET 8-compatible versions, (5) run the test suite. Most non-UI code moves with little more than namespace churn.</p></div>

<div class="callout danger"><div class="co-title">Interview trap</div><p>&ldquo;Is .NET 5+ just .NET Core renamed?&rdquo; Almost &mdash; but not exactly. It kept Core&rsquo;s runtime and tooling while <em>adding back</em> Framework-era APIs (WinForms, WPF) and unifying everything under one BCL. The best one-liner: <strong>.NET 5+ is what .NET Framework should have become if it had been rewritten cross-platform &mdash; and now it finally is.</strong></p></div>

`
};
