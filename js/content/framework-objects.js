/* Framework Objects reference: what each .NET building block is and how it works */
window.FRAMEWORK_OBJECTS_CONTENT = {
  title: "Framework Objects: What Each Building Block Is and How It Works",
  html: `
<p class="lede">.NET is not one thing &mdash; it is a stack of collaborating objects: a runtime, type systems, compilers, assemblies, and libraries. This reference walks them bottom-up. For each object you get <strong>What it is</strong> (its identity) and <strong>How it works</strong> (its job at build time or run time), with code you can run today.</p>

<div class="callout note"><div class="co-title">How to read this guide</div><p>Read it once top-to-bottom &mdash; the sections build on each other. Then use the cheat-sheet table at the end as a bookmark. Code samples target .NET 8; the concepts are identical on .NET 6/7/9.</p></div>

<h2>The stack at a glance</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 860 280" width="860" height="280" role="img" aria-label="The .NET object stack from source to OS">
  <defs><marker id="fo-a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="230" y="15" width="400" height="40" rx="8" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/>
  <text x="430" y="35" text-anchor="middle" class="dg-text">Your source code</text><text x="430" y="50" text-anchor="middle" class="dg-sub">Program.cs (C#) &middot; .fs (F#) &middot; .vb (VB)</text>
  <rect x="150" y="80" width="270" height="44" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/>
  <text x="285" y="98" text-anchor="middle" class="dg-text">Roslyn compiler</text><text x="285" y="114" text-anchor="middle" class="dg-sub">dotnet build &rarr; csc</text>
  <rect x="460" y="80" width="270" height="44" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/>
  <text x="595" y="98" text-anchor="middle" class="dg-text">Assembly (.dll / .exe)</text><text x="595" y="114" text-anchor="middle" class="dg-sub">IL + metadata + manifest</text>
  <rect x="150" y="150" width="270" height="60" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/>
  <text x="285" y="172" text-anchor="middle" class="dg-text">CLR &mdash; Common Language Runtime</text>
  <text x="285" y="192" text-anchor="middle" class="dg-sub">JIT &middot; GC &middot; type loader &middot; exceptions &middot; threads</text>
  <rect x="460" y="150" width="270" height="60" rx="8" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.5"/>
  <text x="595" y="172" text-anchor="middle" class="dg-text">BCL &mdash; Base Class Library</text>
  <text x="595" y="192" text-anchor="middle" class="dg-sub">System.* &middot; collections &middot; IO &middot; JSON &middot; HTTP</text>
  <rect x="230" y="235" width="400" height="36" rx="8" fill="#f1f3f5" stroke="#8a919e" stroke-width="1.4"/>
  <text x="430" y="258" text-anchor="middle" class="dg-text">Operating system &mdash; Windows &middot; Linux &middot; macOS</text>
  <line x1="420" y1="55" x2="290" y2="78" stroke="#8a919e" stroke-width="1.4" marker-end="url(#fo-a)"/>
  <line x1="420" y1="55" x2="590" y2="78" stroke="#8a919e" stroke-width="1.4" marker-end="url(#fo-a)"/>
  <line x1="290" y1="124" x2="290" y2="148" stroke="#8a919e" stroke-width="1.4" marker-end="url(#fo-a)"/>
  <line x1="595" y1="124" x2="595" y2="148" stroke="#8a919e" stroke-width="1.4" marker-end="url(#fo-a)"/>
  <line x1="430" y1="210" x2="430" y2="233" stroke="#8a919e" stroke-width="1.4" marker-end="url(#fo-a)"/>
</svg>
</div>

<h2>1. The CLR (Common Language Runtime)</h2>
<p><strong>What it is:</strong> the virtual machine that executes every .NET program. The CLR is the agent that loads your assemblies, compiles their IL to machine code, allocates and reclaims memory, enforces type safety, and supplies core services: exceptions, threads, and interoperability. On modern .NET the implementation is called <strong>CoreCLR</strong>; on old .NET Framework it was simply the CLR.</p>
<p><strong>How it works:</strong> when you launch an app, the <em>host</em> (see object 9) starts the CLR, which reads the assembly, loads its types from metadata, and begins executing at the entry point. Each method is JIT-compiled the first time it runs; objects are allocated on the managed heap; the GC reclaims them when unreachable. Nothing in your program runs except through the CLR.</p>
<div class="codeblock"><div class="codeblock-header">Proving the runtime exists &mdash; RuntimeInfo.cs</div><pre><code>// The CLR exposes itself to your code:
Console.WriteLine(RuntimeInformation.FrameworkDescription);  // ".NET 8.0.x"
Console.WriteLine(Environment.Version);                     // CLR major.minor
Console.WriteLine(GC.MaxGeneration);                        // heap generations (2)

// RuntimeIdentity distinguishes runtimes when multiple are installed:
foreach (var r in RuntimeEnvironment.GetSystemRuntimes())
    Console.WriteLine(r.Name);</code></pre></div>

<h2>2. The CTS (Common Type System)</h2>
<p><strong>What it is:</strong> the formal specification that defines <em>what a type is</em> in .NET &mdash; how classes, structs, interfaces, enums, and delegates are declared, inherited, and used. It is the reason a type written in C# is usable from F# or VB with no translation layer.</p>
<p><strong>How it works:</strong> every type the compiler emits follows CTS rules: all types ultimately derive from <code>System.Object</code>; each is either a <em>value type</em> (copied by value, lives on the stack or inline) or a <em>reference type</em> (copied by reference, lives on the heap); members have defined visibility, and generics are part of the type identity. The C# keywords are aliases for CTS types:</p>
<div class="codeblock"><div class="codeblock-header">Cts.cs &mdash; keywords are just aliases</div><pre><code>int n = 42;                       // C# keyword...
Int32 same = 42;                  // ...for the CTS type System.Int32
Console.WriteLine(n.GetType().FullName);   // System.Int32

object boxed = n;                 // CTS rule: EVERY type is-a System.Object
int back = (int)boxed;            // unboxing &mdash; works only because types are known

Type t = typeof(System.Collections.Generic.List&lt;int&gt;);
Console.WriteLine(t.IsGenericType);        // metadata-driven reflection (CTS info)</code></pre></div>

<h2>3. The CLS (Common Language Specification)</h2>
<p><strong>What it is:</strong> a mutually agreed subset of the CTS &mdash; the rules a public library must follow so that <em>every</em> .NET language can consume it. Think of the CTS as the full grammar and the CLS as the &ldquo;lingua franca&rdquo; subset.</p>
<p><strong>How it works:</strong> you flag an assembly <code>[assembly: CLSCompliant(true)]</code>; the compiler then warns whenever a public member breaks cross-language rules (e.g., exposing <code>uint</code>, which some languages lack, or two public members differing only by case). Library authors care; app developers rarely need to.</p>
<div class="codeblock"><div class="codeblock-header">Properties/AssemblyInfo.cs</div><pre><code>[assembly: CLSCompliant(true)]

// This now produces a compiler warning &mdash; uint is not CLS-compliant:
public class BadApi
{
    public uint Count { get; set; }          // CS3013-ish warning
    public long SafeCount { get; set; }      // long maps on every language
}</code></pre></div>

<h2>4. IL (Intermediate Language) and assemblies</h2>
<p><strong>What it is:</strong> IL (also called CIL) is the portable bytecode your C# compiles into. An <strong>assembly</strong> is the unit of packaging &mdash; a <code>.dll</code> or self-contained <code>.exe</code> &mdash; holding three things: the IL, <em>metadata</em> (a complete description of every type and member), and a <em>manifest</em> (identity, version, dependencies).</p>
<p><strong>How it works:</strong> Roslyn translates source &rarr; IL; the CLR translates IL &rarr; machine code (via the JIT). Because IL plus metadata describe your types completely, tools can reflect over your program, and any .NET language can consume your library. Inspect it yourself:</p>
<div class="codeblock"><div class="codeblock-header">Assembly.cs &mdash; reading assembly facts at run time</div><pre><code>var asm = typeof(Program).Assembly;

Console.WriteLine(asm.FullName);
// HelloDotNet, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null  (the manifest)
Console.WriteLine(asm.Location);
// .../bin/Debug/net8.0/HelloDotNet.dll  &larr; one file carrying IL + metadata

// Metadata lets you inspect types without their source:
foreach (var type in asm.GetTypes().Take(3))
    Console.WriteLine($"{type.Name} has {type.GetMembers().Length} members");

// terminal &mdash; disassemble the IL itself:
//   dotnet tool install -g ilspycmd
//   ilspycmd bin/Debug/net8.0/HelloDotNet.dll</code></pre></div>

<h2>5. Roslyn, the compiler platform</h2>
<p><strong>What it is:</strong> the open-source compiler for C# and Visual Basic &mdash; and simultaneously an API surface over code analysis. Every build, every red squiggle, every source generator runs through it.</p>
<p><strong>How it works:</strong> Roslyn parses your files into a syntax tree, binds identifiers to symbols using the CTS rules, and emits IL + metadata into assemblies. Because the compiler is itself a service, your IDE gets live diagnostics, refactorings are deterministic, and you can write <em>analyzers</em> (custom rules) and <em>source generators</em> (code that writes code &mdash; used by Day 22&rsquo;s MVVM toolkit).</p>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; Roslyn is visible in everyday commands</div><pre><code>dotnet build -v n          # lists every project, compiler invocation, and output
dotnet format              # Roslyn-powered code style fixes
dotnet build /p:EnforceCodeStyleInBuild=true</code></pre></div>

<h2>6. The JIT compiler (Just-In-Time)</h2>
<p><strong>What it is:</strong> the CLR component that turns IL into real machine code at run time, one method at a time, on the exact CPU you are running.</p>
<p><strong>How it works:</strong> the first call to a method goes through a tiny stub into the JIT; it compiles the method with CPU-specific optimizations (SIMD, inlining), caches the native code in memory, and every later call is a direct jump. <strong>Tiered compilation</strong> refines this: tier 0 compiles fast with minimal optimization (quick startup), tier 1 recompiles hot methods with full optimization in the background. <strong>Native AOT</strong> (Day 1&rsquo;s mention) is the alternative: all IL &rarr; machine code at publish time, no JIT at run time &mdash; instant start, smaller footprint, but no runtime code generation.</p>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; watch tiering and AOT</div><pre><code># See when tiers compile (counts per tier per method):
dotnet run -c Release --property:PublishReadyToRun=false \
  /p:TieredCompilationQuickJit=false

# Publish Native AOT &mdash; no JIT at run time:
dotnet publish -c Release -r win-x64 /p:PublishAot=true</code></pre></div>

<h2>7. The Garbage Collector (GC)</h2>
<p><strong>What it is:</strong> the CLR&rsquo;s automatic memory manager. It tracks every heap object and frees the ones your program can no longer reach.</p>
<p><strong>How it works:</strong> allocation is a pointer bump on <em>Gen&nbsp;0</em>. When it fills, a GC runs: it marks all objects reachable from your code, then compacts survivors upward &mdash; Gen&nbsp;0 survivors move to Gen&nbsp;1, Gen&nbsp;1 survivors to Gen&nbsp;2. Younger collections are frequent and nanosecond-cheap; Gen&nbsp;2 (and the LOH, for objects &ge;&nbsp;85&nbsp;KB) is collected rarely because it is expensive. The Workstation/Server variants trade latency for throughput; <code>GCCollectionMode.Aggressive</code> exists for special cases.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="GC mark and copy flow across generations">
  <defs><marker id="fo-gc" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="30" y="40" width="220" height="60" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/>
  <text x="140" y="65" text-anchor="middle" class="dg-text">Gen 0 &mdash; new allocations</text>
  <text x="140" y="83" text-anchor="middle" class="dg-sub">collected most often &middot; cheapest</text>
  <rect x="310" y="40" width="220" height="60" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/>
  <text x="420" y="65" text-anchor="middle" class="dg-text">Gen 1 &mdash; survivors</text>
  <text x="420" y="83" text-anchor="middle" class="dg-sub">buffer between short/long lived</text>
  <rect x="590" y="40" width="200" height="60" rx="10" fill="#fdecec" stroke="#dc2626" stroke-width="1.4"/>
  <text x="690" y="65" text-anchor="middle" class="dg-text">Gen 2 + LOH</text>
  <text x="690" y="83" text-anchor="middle" class="dg-sub">long-lived &middot; expensive to collect</text>
  <line x1="250" y1="70" x2="308" y2="70" stroke="#8a919e" stroke-width="1.6" marker-end="url(#fo-gc)"/>
  <line x1="530" y1="70" x2="588" y2="70" stroke="#8a919e" stroke-width="1.6" marker-end="url(#fo-gc)"/>
  <text x="410" y="130" text-anchor="middle" class="dg-sub">survivors copy rightward; unreachable objects vanish &mdash; no fragmentation, no free-list</text>
</svg>
</div>
<div class="codeblock"><div class="codeblock-header">Gc.cs &mdash; observing and tuning the GC</div><pre><code>Console.WriteLine($"max generations: {GC.MaxGeneration}");
Console.WriteLine($"collected so far: {GC.CollectionCount(0)} gen0, {GC.CollectionCount(2)} gen2");

var before = GC.GetTotalAllocatedBytes();
DoWork();
var after = GC.GetTotalAllocatedBytes();
Console.WriteLine($"allocated: {(after - before) / 1024.0:F1} KB");   // perf signal

// Server GC in csproj &mdash; for throughput on servers (per-core heaps, parallel GC):
//   &lt;ServerGarbageCollection&gt;true&lt;/ServerGarbageCollection&gt;</code></pre></div>

<h2>8. The BCL (Base Class Library)</h2>
<p><strong>What it is:</strong> the standard library &mdash; the <code>System.*</code> assemblies every .NET app gets: collections, IO, networking, JSON, crypto, threading, reflection, and the primitive types the CTS defines.</p>
<p><strong>How it works:</strong> your code references the BCL via the runtime package (<code>Microsoft.NETCore.App</code>), so there is nothing to install. The BCL is where the platform&rsquo;s promises live: <code>Span&lt;T&gt;</code> for copy-free slicing, <code>System.Text.Json</code> for serialization, <code>CancellationToken</code> for cooperative shutdown, <code>IAsyncEnumerable&lt;T&gt;</code> for streaming. When a NuGet package provides the same type, the BCL version is the authoritative one.</p>
<div class="codeblock"><div class="codeblock-header">Bcl.cs &mdash; a tour in 15 lines</div><pre><code>// Collections and LINQ (Day 4, 6)
var top = new[] { 5, 3, 9 }.OrderByDescending(x =&gt; x).First();

// IO + JSON (Day 12)
var cfg = JsonSerializer.Deserialize&lt;Dictionary&lt;string, string&gt;&gt;("{}");

// Networking (Day 11)
using var http = new HttpClient();
// var page = await http.GetStringAsync("https://example.com");

// Text &amp; math
var normalized = string.Join(" ", "hello   world".Split(' ', StringSplitOptions.RemoveEmptyEntries));
var rounded = Math.Round(2.5, MidpointRounding.AwayFromZero);

// Time (always UTC for storage!)
var utcNow = DateTime.UtcNow;          // + TimeSpan, DateTimeOffset, TimeOnly&hellip;</code></pre></div>

<h2>9. The host and the runtime startup</h2>
<p><strong>What it is:</strong> the native entry point that loads the CLR and hands it your DLL &mdash; <code>dotnet</code> itself, the apphost <code>.exe</code>, IIS&rsquo;s module, or a container entrypoint.</p>
<p><strong>How it works:</strong> for a framework-dependent deploy, <code>hostfxr</code> finds the highest installed runtime matching your <code>net8.0</code> roll-forward policy, loads CoreCLR (<code>coreclr.dll</code>/<code>libcoreclr.so</code>), and starts execution in <code>System.Reflection.RuntimeAssembly</code>&rsquo;s entry point. For self-contained or Native AOT publishes the runtime ships inside your app &mdash; that is what makes single-file, no-install deployments possible.</p>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; the host in action</div><pre><code>dotnet run                        # hostfxr picks the runtime, starts CoreCLR
dotnet --list-runtimes            # what hosts can find on this machine
# Apphost (the .exe) &mdash; a tiny native stub embedding the DLL search:
#   HelloDotNet.exe  &rarr;  finds runtime &rarr; loads HelloDotNet.dll &rarr; runs Main</code></pre></div>

<h2>10. The SDK, MSBuild, and NuGet</h2>
<p><strong>What it is:</strong> the toolchain around the compiler. The <strong>SDK</strong> bundles Roslyn, MSBuild, and the default build targets; <strong>MSBuild</strong> is the engine that turns csproj + source into outputs; <strong>NuGet</strong> is the package manager that resolves <code>PackageReference</code>s into cached assemblies.</p>
<p><strong>How it works:</strong> <code>dotnet build</code> evaluates your SDK-style csproj (implicit files, targets), computes the dependency graph via NuGet restore, then invokes csc with resolved references. <code>dotnet publish</code> adds deployment steps: trimming (removing unused IL), single-file bundling, AOT. All three tools are one binary with different verbs.</p>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; one toolchain, many verbs</div><pre><code>dotnet restore         # NuGet: resolve + cache packages into obj/
dotnet build           # MSBuild: compile to bin/
dotnet publish         # build + trim + bundle for deployment
dotnet pack            # build + produce your own .nupkg for NuGet.org
dotnet nuget locals all --list   # where packages are cached on disk</code></pre></div>

<h2>11. App models: what you build on top</h2>
<p><strong>What it is:</strong> the specialized frameworks that sit on the CLR + BCL and give you a ready-made execution environment for a kind of app &mdash; console, ASP.NET Core (web APIs and sites), Blazor, MAUI, Orleans grains, Worker services.</p>
<p><strong>How it works:</strong> each app model contributes the <em>host</em> and the <em>lifecycle</em>: ASP.NET Core hosts Kestrel and the middleware pipeline (Day 15); MAUI hosts a native window and the binding system (Day 23); Orleans hosts a silo and the grain scheduler (Day 25). Underneath, all of them are ordinary .NET libraries calling BCL APIs &mdash; which is why DI, logging, and configuration (Day 14) look identical everywhere.</p>
<div class="codeblock"><div class="codeblock-header">AppModel.cs &mdash; every app model is the same shape</div><pre><code>// Console:           your code runs top to bottom, then the host exits.
// Worker Service:    builder.Host.UseWindowsService(); BackgroundService runs forever.
// ASP.NET Core:      WebApplication.CreateBuilder + Kestrel + endpoints (Day 15).
// Orleans:           UseOrleans(...) + grains (Day 25).
// They all share:    ServiceCollection (DI), ILogger, IConfiguration, HttpClient&hellip;</code></pre></div>

<h2>12. .NET Standard and target framework monikers</h2>
<p><strong>What it is:</strong> <em>.NET Standard</em> was a versioned contract of APIs every .NET flavor promised to implement &mdash; the trick that let one NuGet package run on Framework, Core, and modern .NET. Its job is now done: since .NET 5 the contract is simply <code>netX.0</code> itself.</p>
<p><strong>How it works:</strong> the <code>TargetFramework</code> (TFM) in your csproj decides which API surface the compiler shows you and which runtimes can load the output. <code>netstandard2.0</code> = maximum compatibility (Framework included), <code>net8.0</code> = full modern surface. Multi-targeting builds one binary per TFM.</p>
<div class="codeblock"><div class="codeblock-header">MultiTarget.csproj</div><pre><code>&lt;PropertyGroup&gt;
  &lt;!-- Ship to both old and new consumers from one project: --&gt;
  &lt;TargetFrameworks&gt;netstandard2.0;net8.0&lt;/TargetFrameworks&gt;
&lt;/PropertyGroup&gt;

&lt;!-- Conditional code per TFM: --&gt;
#if NETSTANDARD2_0
    // older API surface only
#else
    // net8.0-only APIs available here
#endif</code></pre></div>

<h2>13. NuGet packages and the dependency graph</h2>
<p><strong>What it is:</strong> NuGet is both the <a href="https://www.nuget.org" target="_blank" rel="noopener">nuget.org</a> package repository and the subsystem that resolves your project&rsquo;s dependencies into a flat, conflict-free set of assemblies.</p>
<p><strong>How it works:</strong> on <code>restore</code>, NuGet walks your <code>PackageReference</code> graph (including transitive dependencies), picks versions (lowest matching, with your constraints), downloads to the global cache, and writes <code>obj/project.assets.json</code> &mdash; the resolved graph MSBuild consumes. Conflicts surface as compile warnings; <code>dotnet list package --vulnerable</code> audits security.</p>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; inspecting the graph</div><pre><code>dotnet list package --include-transitive     # everything you actually depend on
dotnet list package --vulnerable             # security audit
dotnet add package Newtonsoft.Json --version 13.0.3
dotnet remove package Newtonsoft.Json</code></pre></div>

<h2>Cheat sheet: every object, one line each</h2>
<div class="table-wrap"><table>
<thead><tr><th>Object</th><th>What it is</th><th>How it works (its job)</th></tr></thead>
<tbody>
<tr><td><strong>CLR</strong></td><td>the virtual machine</td><td>loads assemblies, JITs IL, manages memory/threads/exceptions</td></tr>
<tr><td><strong>CTS</strong></td><td>the type-system spec</td><td>defines classes/structs/interfaces; everything is-a <code>System.Object</code></td></tr>
<tr><td><strong>CLS</strong></td><td>cross-language subset</td><td>rules that keep public APIs consumable from all .NET languages</td></tr>
<tr><td><strong>IL</strong></td><td>portable bytecode</td><td>Roslyn emits it; CLR/AOT translates it to machine code</td></tr>
<tr><td><strong>Assembly</strong></td><td>unit of packaging</td><td>.dll/.exe holding IL + metadata + manifest</td></tr>
<tr><td><strong>Roslyn</strong></td><td>compiler platform</td><td>source &rarr; syntax trees &rarr; IL; powers analyzers and generators</td></tr>
<tr><td><strong>JIT</strong></td><td>runtime compiler</td><td>method-at-a-time native code, tiered for fast startup</td></tr>
<tr><td><strong>GC</strong></td><td>memory manager</td><td>marks reachable objects, compacts survivors across generations</td></tr>
<tr><td><strong>BCL</strong></td><td>standard library</td><td>System.* types: collections, IO, JSON, HTTP, threading</td></tr>
<tr><td><strong>Host</strong></td><td>runtime launcher</td><td>hostfxr finds the runtime, starts CoreCLR, runs Main</td></tr>
<tr><td><strong>SDK/MSBuild</strong></td><td>toolchain</td><td>restore &rarr; compile &rarr; publish; one CLI with many verbs</td></tr>
<tr><td><strong>App models</strong></td><td>hosted frameworks</td><td>console, ASP.NET Core, Blazor, MAUI, Orleans &mdash; same DI/logging core</td></tr>
<tr><td><strong>.NET Standard</strong></td><td>API contract (retired)</td><td>netstandard2.0 for legacy reach; net8.0 for modern apps</td></tr>
<tr><td><strong>NuGet</strong></td><td>package manager</td><td>restores the dependency graph into project.assets.json</td></tr>
</tbody></table></div>

<div class="callout tip"><div class="co-title">See it all connected on Day 1</div><p>Run <code>dotnet run</code> once more after reading this. The host loads the CLR, the CLR JITs your IL from the assembly Roslyn built, the BCL prints to the console, and the GC sweeps behind you. That single command exercises every object in this guide.</p></div>
`
};
