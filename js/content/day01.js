/* Day 1: Getting Started with .NET */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[1] = {
  html: `
<p>Today you install the toolchain, learn the four CLI commands you will use every single day, and run your first C# program. Everything else in this course builds on this setup.</p>

<h2>What exactly is .NET?</h2>
<p>.NET is a <strong>developer platform</strong>: a runtime that executes your code (the Common Language Runtime, CLR), a huge standard library (the Base Class Library, BCL), compilers for C# and F#, and tooling that ties it together. You write C# (an <em>application-level language</em> with strong types, generics, and LINQ), the compiler turns it into <strong>IL</strong> (intermediate language), and the CLR compiles IL to machine code at run time (JIT) or ahead of time (AOT).</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="From source code to running program">
  <defs><marker id="d1a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8a919e"/></marker></defs>
  <rect x="20" y="50" width="140" height="50" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="90" y="72" text-anchor="middle" class="dg-text">Your code</text><text x="90" y="88" text-anchor="middle" class="dg-sub">Program.cs (C#)</text>
  <rect x="220" y="50" width="140" height="50" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="290" y="72" text-anchor="middle" class="dg-text">Roslyn compiler</text><text x="290" y="88" text-anchor="middle" class="dg-sub">dotnet build</text>
  <rect x="420" y="50" width="140" height="50" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="490" y="72" text-anchor="middle" class="dg-text">IL + assemblies</text><text x="490" y="88" text-anchor="middle" class="dg-sub">bin/Debug/*.dll</text>
  <rect x="620" y="50" width="170" height="50" rx="8" fill="#ece8fe" stroke="#7c3aed" stroke-width="1.5"/><text x="705" y="72" text-anchor="middle" class="dg-text">CLR executes</text><text x="705" y="88" text-anchor="middle" class="dg-sub">JIT &rarr; machine code</text>
  <line x1="160" y1="75" x2="212" y2="75" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d1a)"/>
  <line x1="360" y1="75" x2="412" y2="75" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d1a)"/>
  <line x1="560" y1="75" x2="612" y2="75" stroke="#8a919e" stroke-width="1.5" marker-end="url(#d1a)"/>
</svg>
</div>

<h2>Install the SDK</h2>
<p>Download the <strong>.NET 8 SDK</strong> (not just the runtime &mdash; the SDK includes the compiler and CLI) from <a href="https://dotnet.microsoft.com/download" target="_blank" rel="noopener">dotnet.microsoft.com</a>, or use a package manager:</p>
<div class="codeblock"><div class="codeblock-header">terminal</div><pre><code># Windows (winget)
winget install Microsoft.DotNet.SDK.8

# macOS (Homebrew)
brew install --cask dotnet-sdk

# Verify &mdash; this should print 8.x
dotnet --version
dotnet --list-sdks</code></pre></div>

<h2>The four commands you will use every day</h2>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; create, restore, run, test</div><pre><code>dotnet new console -n HelloDotNet   # scaffold a console project
dotnet run                          # compile + execute it
dotnet build                        # compile without running
dotnet test                         # run the test suite (from a test project)</code></pre></div>

<h2>Your first program, line by line</h2>
<div class="codeblock"><div class="codeblock-header">Program.cs &mdash; .NET 6+ style (top-level statements)</div><pre><code>// Everything at the top of Program.cs runs in order &mdash; no class or Main needed.
Console.WriteLine("Hello, .NET!");

var name = "developer";
Console.WriteLine($"Welcome, {name}. The CLI is already working.");

// Environment info proves which runtime you are on:
Console.WriteLine($"Runtime: {Environment.Version}");
Console.WriteLine($"OS:      {Environment.OSVersion}");</code></pre></div>
<div class="codeblock"><div class="codeblock-header">Explicit style &mdash; what the compiler generates underneath</div><pre><code>namespace HelloDotNet;

// Top-level statements are sugar for a static Main inside a generated Program class.
internal class Program
{
    private static void Main(string[] args)
    {
        Console.WriteLine("Hello, .NET!");
    }
}</code></pre></div>
<div class="callout note"><div class="co-title">Top-level statements</div><p>Since C# 9, small programs can skip the <code>Main</code> ceremony entirely. Both forms compile to the same thing. Use top-level for scripts and learning; use explicit <code>Main</code> when a project grows or needs two entry points.</p></div>

<h2>How a project is laid out</h2>
<div class="codeblock"><div class="codeblock-header">terminal &mdash; after dotnet new console</div><pre><code>HelloDotNet/
&#9500;&#9472;&#9472; HelloDotNet.csproj   # project file: target framework, package refs
&#9500;&#9472;&#9472; Program.cs           # your code
&#9492;&#9472;&#9472; obj/ &amp; bin/          # build artifacts (gitignore these)</code></pre></div>
<div class="codeblock"><div class="codeblock-header">HelloDotNet.csproj</div><pre><code>&lt;Project Sdk="Microsoft.NET.Sdk"&gt;

  &lt;PropertyGroup&gt;
    &lt;OutputType&gt;Exe&lt;/OutputType&gt;
    &lt;TargetFramework&gt;net8.0&lt;/TargetFramework&gt;
    &lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;
    &lt;Nullable&gt;enable&lt;/Nullable&gt;
  &lt;/PropertyGroup&gt;

&lt;/Project&gt;</code></pre></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (15 min)</div>
<p>Create a console project named <code>Playground</code> that prints your name, the current date, and the runtime version. Then change the output to use string interpolation with a computed value &mdash; for example, the year you were born from an age constant. Run it with <code>dotnet run</code>. Finally, run <code>dotnet build -c Release</code> and find the produced files under <code>bin/Release/net8.0</code>.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>The <strong>SDK</strong> compiles and runs code; the <strong>runtime</strong> only executes it.</li>
  <li><code>dotnet new / build / run / test</code> is the daily loop.</li>
  <li>Modern C# hides the <code>Main</code> boilerplate with top-level statements.</li>
  <li>The csproj is small and declarative &mdash; the SDK infers the rest.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Add a <code>--verbose</code> flag printing assembly location + runtime version side by side.</li><li>Create a second project in the same solution and reference it (<code>dotnet add reference</code>) &mdash; call a method across projects.</li><li>Run with <code>dotnet run -- --help</code> and print usage when args contain <code>--help</code>.</li></ul>
`,
  quiz: [
    {
      "q": "What does the .NET SDK include that the runtime alone does not?",
      "a": [
        "The GC",
        "The compiler and CLI tools",
        "Kestrel",
        "Entity Framework"
      ],
      "correct": 1,
      "expl": "The SDK bundles Roslyn, MSBuild, and the dotnet CLI; the runtime only executes already-compiled programs."
    },
    {
      "q": "Which command compiles AND runs a console project?",
      "a": [
        "dotnet start",
        "dotnet execute",
        "dotnet run",
        "dotnet go"
      ],
      "correct": 2,
      "expl": "dotnet run builds (if needed) and executes in one step."
    },
    {
      "q": "Top-level statements in Program.cs mean…",
      "a": [
        "The compiler skips compilation",
        "No Main method is needed",
        "The app runs faster",
        "Globals are allowed"
      ],
      "correct": 1,
      "expl": "The compiler synthesizes Program.Main around your statements — same IL as the explicit form."
    },
    {
      "q": "Source code is compiled into which intermediate form?",
      "a": [
        "Machine code directly",
        "Java bytecode",
        "IL inside assemblies",
        "LLVM IR"
      ],
      "correct": 2,
      "expl": "Roslyn emits IL + metadata into .dll assemblies; the CLR JITs IL to machine code at run time."
    }
  ]

};