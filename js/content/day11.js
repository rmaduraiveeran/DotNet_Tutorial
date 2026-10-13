/* Day 11: Async/Await & Concurrency */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[11] = {
  html: `
<p>Async is the difference between a UI that freezes and a server that handles 10,000 concurrent requests. Today: <code>Task</code>, <code>await</code>, cancellation, and the concurrency traps.</p>

<h2>What async actually buys you</h2>
<p><code>await</code> releases the thread while I/O is in flight. On a web server that means the thread can serve other requests; on a UI, the window keeps painting. It does <strong>not</strong> mean parallelism &mdash; it means not wasting a thread on waiting.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 820 190" width="820" height="190" role="img" aria-label="Sync vs async thread usage">
  <text x="30" y="28" class="dg-text">Synchronous &mdash; thread blocked</text>
  <rect x="30" y="40" width="120" height="28" rx="5" fill="#fdecec" stroke="#dc2626"/><text x="90" y="59" text-anchor="middle" class="dg-sub">work 10ms</text>
  <rect x="150" y="40" width="380" height="28" rx="5" fill="#fef3e2" stroke="#d97706"/><text x="340" y="59" text-anchor="middle" class="dg-sub">WAITING on I/O &mdash; thread does nothing for 800ms</text>
  <rect x="530" y="40" width="120" height="28" rx="5" fill="#fdecec" stroke="#dc2626"/><text x="590" y="59" text-anchor="middle" class="dg-sub">work 10ms</text>
  <text x="30" y="108" class="dg-text">Asynchronous &mdash; thread released during I/O</text>
  <rect x="30" y="120" width="120" height="28" rx="5" fill="#e7f8f1" stroke="#0e9f6e"/><text x="90" y="139" text-anchor="middle" class="dg-sub">work 10ms</text>
  <rect x="150" y="120" width="380" height="28" rx="5" fill="#ece8fe" stroke="#7c3aed"/><text x="340" y="139" text-anchor="middle" class="dg-sub">await &mdash; thread goes back to the pool</text>
  <rect x="530" y="120" width="120" height="28" rx="5" fill="#e7f8f1" stroke="#0e9f6e"/><text x="590" y="139" text-anchor="middle" class="dg-sub">work 10ms</text>
</svg>
</div>

<h2>Async / await mechanics</h2>
<div class="codeblock"><div class="codeblock-header">Async.cs</div><pre><code>// Async methods return Task (void) or Task&lt;T&gt; (a value) &mdash; and end in Async.
public async Task&lt;string&gt; GetUserPageAsync(HttpClient http, CancellationToken ct)
{
    // await = "pause here, resume on the result" &mdash; no thread is blocked:
    string html = await http.GetStringAsync("https://example.com/user", ct);

    // Everything after await runs when the result arrives:
    return html.Length &gt; 0 ? html : "empty";
}

// Independent calls &rarr; run them CONCURRENTLY, don't await serially:
var userTask   = http.GetStringAsync(url1, ct);    // starts
var ordersTask = http.GetStringAsync(url2, ct);    // starts immediately
string[] both  = await Task.WhenAll(userTask, ordersTask);   // join

// Sequential when dependent &mdash; this is correct, not a mistake:
var user = await GetUserAsync(id, ct);
var orders = await GetOrdersAsync(user.Id, ct);</code></pre></div>
<div class="callout warning"><div class="co-title">The #1 async mistake</div><p><code>var a = GetAsync(); ... var x = a.Result;</code> &mdash; blocking on a Task deadlocks UI apps and starves thread-pool servers. There are exactly two valid uses of <code>.Result</code>: console Main before you knew better, and never. Always <code>await</code>.</p></div>

<h2>CancellationToken: cooperative shutdown</h2>
<div class="codeblock"><div class="codeblock-header">Cancellation.cs</div><pre><code>public async Task PollAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        await DoWorkAsync(ct);
        await Task.Delay(TimeSpan.FromSeconds(5), ct);  // throws TaskCanceledException
    }
}

// Caller side:
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));  // auto-cancel at 30s
try { await PollAsync(cts.Token); }
catch (OperationCanceledException) { Console.WriteLine("Stopped politely"); }</code></pre></div>

<h2>Thread safety in 60 seconds</h2>
<div class="codeblock"><div class="codeblock-header">Concurrency.cs</div><pre><code>var counter = 0;
await Parallel.ForEachAsync(Enumerable.Range(0, 100_000), async (i, ct) =&gt;
{
    Interlocked.Increment(ref counter);   // atomic &mdash; plain counter++ loses updates
});

// Or protect a block with a lock (never await inside lock!):
var gate = new object();
int safeTotal = 0;
lock (gate) { safeTotal++; }

// Concurrent collections for shared state:
var bag = new ConcurrentBag&lt;int&gt;();
var dict = new ConcurrentDictionary&lt;string, int&gt;();
dict.AddOrUpdate("hits", 1, (_, n) =&gt; n + 1);</code></pre></div>

<h2>Async all the way up</h2>
<p>One sync call in an async chain blocks the whole pipeline. Libraries signal the danger: sync APIs that take a <code>CancellationToken</code> get async twins; EF Core has <code>ToListAsync</code>; streams have <code>ReadAsync</code>. Console apps may <code>await</code> directly in top-level statements &mdash; the compiler synthesizes an async-compatible entry point.</p>
<div class="callout tip"><div class="co-title">ValueTask in one paragraph</div><p>Hot paths can return <code>ValueTask&lt;T&gt;</code> instead of <code>Task&lt;T&gt;</code> to avoid allocating a Task when the result is usually cached/synchronous. Rules: await it exactly once, never store it, never await twice. If unsure, plain <code>Task</code> is always correct.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (30 min)</div>
<p>Build a "site monitor": fetch 5 URLs concurrently with <code>HttpClient</code> + <code>Task.WhenAll</code>, print each with its elapsed time, support Ctrl+C via <code>CancellationTokenSource</code>, and report the fastest and slowest. Then make it fail gracefully when one URL is unreachable &mdash; one bad site must not kill the batch (hint: wrap each task so failures become results).</p></div>

<h2>Key takeaways</h2>
<ul>
  <li><code>await</code> frees threads during I/O; it is not parallelism.</li>
  <li>Independent work: start tasks, then <code>Task.WhenAll</code>.</li>
  <li>Never block on async code; propagate <code>CancellationToken</code>s.</li>
  <li>Shared mutable state needs <code>Interlocked</code>, locks, or concurrent collections.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Implement <code>static async Task&lt;(T a, U b)&gt; WhenBoth&lt;T,U&gt;(Task&lt;T&gt;, Task&lt;U&gt;)</code> using <code>WhenAll</code> + a cast.</li><li>Write the timeout race: <code>Task.WhenAny(work, Task.Delay(500))</code> &mdash; and cancel the loser properly.</li><li>Benchmark sequential vs concurrent fetches of 5 URLs; print both totals.</li></ul>
`,
  quiz: [
    {
      "q": "await on an I/O call…",
      "a": [
        "Blocks the thread",
        "Releases the thread while the I/O is in flight",
        "Creates a new thread",
        "Runs on the GPU"
      ],
      "correct": 1,
      "expl": "await = asynchronous wait; the thread returns to the pool."
    },
    {
      "q": "Two independent HTTP calls should be…",
      "a": [
        "Awaited one then the other",
        "Started together, joined with Task.WhenAll",
        "Run in a loop",
        "Made synchronous"
      ],
      "correct": 1,
      "expl": "Start both, await both — total latency is the max, not the sum."
    },
    {
      "q": "task.Result in ASP.NET Core is dangerous because it…",
      "a": [
        "Is deprecated",
        "Can deadlock/starve the thread pool",
        "Is slower only sometimes",
        "Throws always"
      ],
      "correct": 1,
      "expl": "Blocking on async code is the classic async bug — always await."
    },
    {
      "q": "counter++ from 100 parallel tasks loses updates because…",
      "a": [
        "The GC interferes",
        "++ is not atomic — use Interlocked.Increment",
        "Tasks are slow",
        "Ints overflow"
      ],
      "correct": 1,
      "expl": "Read-modify-write races; Interlocked makes it atomic."
    }
  ]

};