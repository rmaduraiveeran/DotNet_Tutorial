/* Day 10: Exception Handling & Resources */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[10] = {
  html: `
<p>Things fail: networks drop, files vanish, users type nonsense. Today: how exceptions flow, how to handle them without lying, and how <code>using</code> prevents resource leaks.</p>

<h2>The exception pipeline</h2>
<p>When something goes wrong, a method throws an exception object. The CLR unwinds the call stack until it finds a matching <code>catch</code>. If none exists, the process crashes &mdash; which is often the honest outcome.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 150" width="820" height="150" role="img" aria-label="Exception propagation">
  <defs><marker id="d10a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#dc2626"/></marker></defs>
  <rect x="20" y="50" width="160" height="44" rx="8" fill="#fdecec" stroke="#dc2626" stroke-width="1.5"/><text x="100" y="70" text-anchor="middle" class="dg-text">throw</text><text x="100" y="86" text-anchor="middle" class="dg-sub">deep in a service</text>
  <rect x="240" y="50" width="160" height="44" rx="8" fill="#fdecec" stroke="#dc2626" stroke-width="1.5"/><text x="320" y="70" text-anchor="middle" class="dg-text">unwinds</text><text x="320" y="86" text-anchor="middle" class="dg-sub">finally blocks run</text>
  <rect x="460" y="50" width="160" height="44" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="540" y="70" text-anchor="middle" class="dg-text">nearest catch</text><text x="540" y="86" text-anchor="middle" class="dg-sub">or process exit</text>
  <rect x="660" y="50" width="140" height="44" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="730" y="70" text-anchor="middle" class="dg-text">log + recover</text><text x="730" y="86" text-anchor="middle" class="dg-sub">or translate</text>
  <line x1="180" y1="72" x2="238" y2="72" stroke="#dc2626" stroke-width="1.5" marker-end="url(#d10a)"/>
  <line x1="400" y1="72" x2="458" y2="72" stroke="#dc2626" stroke-width="1.5" marker-end="url(#d10a)"/>
  <line x1="620" y1="72" x2="658" y2="72" stroke="#dc2626" stroke-width="1.5" marker-end="url(#d10a)"/>
</svg>
</div>

<h2>try / catch / finally done right</h2>
<div class="codeblock"><div class="codeblock-header">Exceptions.cs</div><pre><code>try
{
    var text = await File.ReadAllTextAsync(path);
    var order = JsonSerializer.Deserialize&lt;Order&gt;(text)
        ?? throw new InvalidDataException($"Empty order file: {path}");
    Process(order);
}
catch (JsonException ex)                       // most specific first
{
    logger.LogError(ex, "Malformed JSON in {Path}", path);
    throw new OrderFormatException(path, ex);  // wrap &mdash; keep the original as InnerException
}
catch (FileNotFoundException) when (!Debugger.IsAttached)  // exception filter
{
    logger.LogWarning("Order file missing: {Path}", path);  // swallow only when justified
}
finally
{
    stopwatch.Stop();   // always runs: success, exception, or rethrow
}</code></pre></div>
<div class="callout danger"><div class="co-title">The three deadly patterns</div><p>(1) <code>catch (Exception) { }</code> &mdash; swallows bugs silently. (2) <code>throw ex;</code> &mdash; destroys the stack trace; use bare <code>throw;</code>. (3) Catching <code>Exception</code> at every layer &mdash; handle where you can act, log where you cannot.</p></div>

<h2>Throwing well: exceptions you should prefer</h2>
<div class="codeblock"><div class="codeblock-header">Throwing.cs</div><pre><code>ArgumentException.ThrowIfNullOrWhiteSpace(name);        // .NET 8 helpers
ArgumentNullException.ThrowIfNull(config);
ArgumentOutOfRangeException.ThrowIfNegative(amount);

// Custom exception &mdash; only when callers will want to catch it specifically:
public class InsufficientFundsException(decimal requested, decimal balance)
    : Exception($"Need {requested}, have {balance}")
{
    public decimal Requested { get; } = requested;
    public decimal Balance { get; } = balance;
}</code></pre></div>

<h2>IDisposable and using &mdash; deterministic cleanup</h2>
<p>Files, sockets, DB connections hold OS resources the GC will not release promptly. <code>using</code> calls <code>Dispose</code> the moment the block exits &mdash; even on exception.</p>
<div class="codeblock"><div class="codeblock-header">Resources.cs</div><pre><code>// Classic using statement:
using (var stream = File.OpenRead("data.txt"))
{
    // read...
}   // stream.Dispose() runs here, no matter how we exit

// C# 8+ using declaration &mdash; disposed at end of enclosing scope:
using var client = new HttpClient();
var html = await client.GetStringAsync("https://example.com");

// Implementing IDisposable yourself (the standard pattern):
public class ReportGenerator : IDisposable
{
    private FileStream? _stream;
    private bool _disposed;

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed) return;
        if (disposing) _stream?.Dispose();   // managed resources
        _disposed = true;
    }

    public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
}</code></pre></div>

<h2>Exceptions vs Result types</h2>
<p>Exceptions are for <em>exceptional</em> paths. For expected business outcomes (&ldquo;cart is empty&rdquo;), a <code>Result</code> type (Day 9) or nullable return reads better and performs better &mdash; throwing is expensive (building the stack trace). Rule of thumb: <strong>if the caller would catch it every time, return a result instead of throwing.</strong></p>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Write <code>ConfigLoader</code> that reads a JSON settings file: throw <code>FileNotFoundException</code> with a helpful message if missing, wrap <code>JsonException</code> in a custom <code>ConfigFormatException</code>, and return a <code>Result&lt;Config&gt;</code> for "valid but empty" instead of throwing. Verify with tests that the stack trace of the inner exception survives your wrap.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Catch specific, rethrow with bare <code>throw;</code>, never swallow silently.</li>
  <li>Exception filters (<code>when</code>) avoid catch-and-rethrow noise.</li>
  <li><code>using</code> gives deterministic resource cleanup.</li>
  <li>Expected failures are results; exceptional failures are exceptions.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Implement <code>static T Retry&lt;T&gt;(Func&lt;T&gt; f, int times)</code> with exponential backoff via <code>Thread.Sleep</code>.</li><li>Make a class both <code>IDisposable</code> and <code>IAsyncDisposable</code> correctly (both paths, shared core).</li><li>Write a test proving <code>InnerException</code> survives two levels of wrapping.</li></ul>
`,
  quiz: [
    {
      "q": "Why is bare 'throw;' better than 'throw ex;'?",
      "a": [
        "It is faster",
        "It preserves the original stack trace",
        "It logs automatically",
        "It retries"
      ],
      "correct": 1,
      "expl": "throw ex resets the stack trace, hiding where the error came from."
    },
    {
      "q": "using (var s = File.OpenRead(...)) guarantees…",
      "a": [
        "The file is read fully",
        "Dispose runs even on exception",
        "No exceptions",
        "Async I/O"
      ],
      "correct": 1,
      "expl": "using compiles to try/finally around Dispose — deterministic cleanup."
    },
    {
      "q": "Empty catch (Exception) { } is bad because it…",
      "a": [
        "Is slow",
        "Swallows bugs silently",
        "Breaks the GC",
        "Is deprecated"
      ],
      "correct": 1,
      "expl": "Failures vanish; you debug symptoms instead of causes."
    },
    {
      "q": "'Cart is empty' should typically be…",
      "a": [
        "An exception",
        "A Result/return value — expected business state",
        "An environment exit",
        "A log-only event"
      ],
      "correct": 1,
      "expl": "Expected outcomes are values; exceptions are for exceptional paths."
    }
  ]

};