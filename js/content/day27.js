/* Day 27: Performance & Memory Deep Dive */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[27] = {
  html: `
<p>Performance in .NET is a discipline: measure first, then apply the right technique. Today: the memory model, allocation-conscious coding, Span, pooling, and BenchmarkDotNet.</p>

<h2>The memory model in one picture</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 210" width="820" height="210" role="img" aria-label="Stack vs heap and GC generations">
  <text x="140" y="30" text-anchor="middle" class="dg-text">Stack (per thread)</text>
  <rect x="60" y="45" width="160" height="90" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/>
  <text x="140" y="70" text-anchor="middle" class="dg-sub">value types &middot; locals</text>
  <text x="140" y="88" text-anchor="middle" class="dg-sub">references to objects</text>
  <text x="140" y="106" text-anchor="middle" class="dg-sub">freed automatically</text>
  <text x="140" y="124" text-anchor="middle" class="dg-sub">(moves the frame pointer)</text>
  <text x="500" y="30" text-anchor="middle" class="dg-text">Managed heap &mdash; GC generations</text>
  <rect x="330" y="45" width="150" height="90" rx="10" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="405" y="80" text-anchor="middle" class="dg-text">Gen 0</text><text x="405" y="100" text-anchor="middle" class="dg-sub">new objects</text>
  <rect x="500" y="45" width="150" height="90" rx="10" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/><text x="575" y="80" text-anchor="middle" class="dg-text">Gen 1</text><text x="575" y="100" text-anchor="middle" class="dg-sub">survived once</text>
  <rect x="670" y="45" width="130" height="90" rx="10" fill="#fdecec" stroke="#dc2626" stroke-width="1.4"/><text x="735" y="80" text-anchor="middle" class="dg-text">Gen 2 / LOH</text><text x="735" y="100" text-anchor="middle" class="dg-sub">long-lived &middot; &gt;85KB</text>
  <text x="410" y="180" text-anchor="middle" class="dg-sub">Cheap collections happen in Gen 0 (nanoseconds). Expensive ones reach Gen 2 &mdash; that is what you design to avoid.</text>
</svg>
</div>

<h2>Measure first: BenchmarkDotNet</h2>
<div class="codeblock"><div class="codeblock-header">Benchmarks.cs</div><pre><code>[MemoryDiagnoser]                        // shows allocations per op
public class ConcatBenchmarks
{
    private readonly string[] parts = Enumerable.Range(0, 100).Select(i =&gt; i.ToString()).ToArray();

    [Benchmark(Baseline = true)]
    public string WithPlus() =&gt; parts.Aggregate("", (a, b) =&gt; a + b);   // O(n&sup2;) + allocs

    [Benchmark]
    public string WithBuilder()
    {
        var sb = new StringBuilder();
        foreach (var p in parts) sb.Append(p);
        return sb.ToString();
    }
}
// dotnet run -c Release &mdash; NEVER benchmark in Debug: no JIT optimizations, wrong numbers.</code></pre></div>

<h2>Technique 1 &mdash; string handling</h2>
<div class="codeblock"><div class="codeblock-header">Strings.cs</div><pre><code>// Interpolation beats concatenation; string.Create avoids intermediate strings:
var result = string.Create(null, stackalloc char[64], $"User {id} scored {score}");
// Composite formatting avoids allocation entirely on the hot path:
logger.LogInformation("User {UserId} scored {Score}", id, score);   // structured, lazy

// Split with spans &mdash; zero allocations:
ReadOnlySpan&lt;char&gt; line = "10,20,30";
foreach (Range r in line.Split(','))          // C# 8 range over span
    Console.WriteLine(int.Parse(line[r]));</code></pre></div>

<h2>Technique 2 &mdash; Span&lt;T&gt; and stackalloc</h2>
<div class="codeblock"><div class="codeblock-header">Spans.cs</div><pre><code>public static int SumDigits(ReadOnlySpan&lt;char&gt; text)
{
    int sum = 0;
    foreach (char c in text)
        if (char.IsAsciiDigit(c)) sum += c - '0';
    return sum;
}

// Stack-allocated buffer &mdash; no heap, freed when the method returns:
Span&lt;byte&gt; buffer = stackalloc byte[256];
Utf8.FromUtf16("hello".AsSpan(), buffer, out _, out _);</code></pre></div>

<h2>Technique 3 &mdash; pooling with ObjectPool / ArrayPool</h2>
<div class="codeblock"><div class="codeblock-header">Pooling.cs</div><pre><code>var pool = ArrayPool&lt;byte&gt;.Shared;            // shared, thread-safe
byte[] rented = pool.Rent(minimumLength: 8192);  // may be bigger &mdash; use Length checks
try { await stream.ReadAsync(rented); }
finally { pool.Return(rented, clearArray: false); }  // ALWAYS return in finally

// ObjectPool for your own heavy objects:
builder.Services.AddSingleton(new DefaultObjectPool&lt;StringBuilder&gt;(new StringBuilderPooledObjectPolicy()));</code></pre></div>
<div class="table-wrap"><table>
<thead><tr><th>Technique</th><th>Saves</th><th>Cost / risk</th></tr></thead>
<tbody>
<tr><td><code>string</code> interpolation</td><td>allocs vs concatenation</td><td>none</td></tr>
<tr><td><code>Span&lt;T&gt;</code> slicing</td><td>copies + allocs</td><td>API surface discipline</td></tr>
<tr><td><code>stackalloc</code></td><td>heap entirely</td><td>small sizes only (default &lt;1KB)</td></tr>
<tr><td>Pools</td><td>GC pressure in hot paths</td><td>must return; bugs = corruption</td></tr>
<tr><td><code>struct</code> + <code>readonly struct</code></td><td>no heap object</td><td>copies on pass (use <code>in</code>)</td></tr>
</tbody></table></div>

<h2>Technique 4 &mdash; async efficiency</h2>
<ul>
  <li><code>ValueTask&lt;T&gt;</code> when results are usually cached (await once only!).</li>
  <li><code>Task.CompletedTask</code> instead of <code>Task.FromResult(0)</code> or async void filler.</li>
  <li><code>ConfigureAwait(false)</code> in library code (not needed in ASP.NET Core &mdash; no sync context).</li>
  <li><code>IAsyncEnumerable&lt;T&gt;</code> to stream data instead of materializing lists.</li>
</ul>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (45 min)</div>
<p>Benchmark three CSV parsers: <code>string.Split</code> + int.Parse, <code>ReadOnlySpan</code> slicing, and <code>MemoryMarshal</code> tricks. Record Mean and Allocated columns. Then take the Day 7 tracker's <code>Load()</code> and make it allocation-free for the common case (file unchanged &mdash; cache by size+timestamp) and prove it with the MemoryDiagnoser numbers.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Benchmark in Release with MemoryDiagnoser &mdash; feelings are not data.</li>
  <li>Gen0 collections are cheap; the win is not allocating in the first place.</li>
  <li>Span + stackalloc + pools are the allocation-killer toolkit.</li>
  <li>Structured logging avoids string-building on paths that don't log.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Benchmark <code>string.Concat</code> vs <code>string.Create</code> vs interpolation &mdash; 3 columns, MemoryDiagnoser.</li><li>Reduce a parser&rsquo;s allocations to zero with <code>ReadOnlySpan</code> + <code>stackalloc</code> &mdash; prove with the allocator column.</li><li>Pool <code>StringBuilder</code> via <code>ObjectPool</code> and measure P95 latency change.</li></ul>
`,
  quiz: [
    {
      "q": "Gen 0 collections are cheap because…",
      "a": [
        "The heap is small",
        "Most objects die young; only the newest region is scanned",
        "The GC pauses",
        "Of compression"
      ],
      "correct": 1,
      "expl": "Generational hypothesis: design allocations to die in Gen 0."
    },
    {
      "q": "BenchmarkDotNet rules…",
      "a": [
        "Debug is fine",
        "Release only, with MemoryDiagnoser for allocations",
        "No warmup needed",
        "Approximate"
      ],
      "correct": 1,
      "expl": "Debug lacks JIT optimizations; allocations matter as much as time."
    },
    {
      "q": "Span<T> slicing avoids…",
      "a": [
        "Null checks",
        "Copying — it is a window over existing memory",
        "Bounds checks",
        "The stack"
      ],
      "correct": 1,
      "expl": "Parse and slice without allocations."
    },
    {
      "q": "ArrayPool<T> exists to…",
      "a": [
        "Sort faster",
        "Reuse buffers and cut GC pressure on hot paths",
        "Save memory on disk",
        "Avoid using statements"
      ],
      "correct": 1,
      "expl": "Rent/return in finally; bugs = corruption."
    }
  ]

};