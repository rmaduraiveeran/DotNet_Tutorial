/* Day 4: Collections & Arrays */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[4] = {
  html: `
<p>Real programs juggle many values. Today: which collection to reach for, and why the choice affects performance.</p>

<h2>The collection family</h2>
<div class="table-wrap"><table>
<thead><tr><th>Collection</th><th>Order</th><th>Duplicates</th><th>Lookup</th><th>Use when</th></tr></thead>
<tbody>
<tr><td><code>T[]</code> (array)</td><td>indexed</td><td>yes</td><td>O(1) by index</td><td>Fixed size, hot paths, interop</td></tr>
<tr><td><code>List&lt;T&gt;</code></td><td>insertion</td><td>yes</td><td>O(1) by index</td><td>The everyday default</td></tr>
<tr><td><code>Dictionary&lt;K,V&gt;</code></td><td>none</td><td>unique keys</td><td>O(1) by key</td><td>Key &rarr; value lookups</td></tr>
<tr><td><code>HashSet&lt;T&gt;</code></td><td>none</td><td>no</td><td>O(1) contains</td><td>Membership tests, dedupe</td></tr>
<tr><td><code>Queue&lt;T&gt;</code></td><td>FIFO</td><td>yes</td><td>&mdash;</td><td>Ordering, job processing</td></tr>
<tr><td><code>Stack&lt;T&gt;</code></td><td>LIFO</td><td>yes</td><td>&mdash;</td><td>Undo, DFS, parsing</td></tr>
</tbody></table></div>

<div class="codeblock"><div class="codeblock-header">Collections.cs</div><pre><code>// Array &mdash; fixed length
int[] primes = [2, 3, 5, 7, 11];          // C# 12 collection expression

// List &mdash; grows on demand
var scores = new List&lt;int&gt; { 90, 85 };
scores.Add(77);
scores.Remove(85);
Console.WriteLine(scores.Count);           // 2

// Dictionary &mdash; key to value
var ages = new Dictionary&lt;string, int&gt;
{
    ["Ada"] = 36,
    ["Alan"] = 41
};
ages["Grace"] = 45;                        // add
if (ages.TryGetValue("Ada", out var ada))  // safe lookup, no exception
    Console.WriteLine(ada);

// HashSet &mdash; unique membership
var tags = new HashSet&lt;string&gt; { "csharp", "dotnet" };
tags.Add("csharp");                        // ignored, already present
Console.WriteLine(tags.Contains("dotnet"));// true, O(1)</code></pre></div>

<h2>How List&lt;T&gt; grows (and why it matters)</h2>
<p><code>List&lt;T&gt;</code> wraps an array. Adding past capacity allocates a bigger array (double the size) and copies. That makes <code>Add</code> amortized O(1) &mdash; but if you know the final size, pre-allocate: <code>new List&lt;int&gt;(capacity: 10_000)</code> avoids the copies entirely.</p>
<div class="diagram-wrap">
<svg viewBox="0 0 800 140" width="800" height="140" role="img" aria-label="List growth by doubling">
  <rect x="30" y="30" width="60" height="34" rx="5" fill="#e7f8f1" stroke="#0e9f6e"/><text x="60" y="52" text-anchor="middle" class="dg-sub">a b</text>
  <text x="105" y="52" class="dg-sub">&#8594; full at capacity 2</text>
  <rect x="230" y="30" width="120" height="34" rx="5" fill="#efedfd" stroke="#6c5ce7"/><text x="290" y="52" text-anchor="middle" class="dg-sub">a b c d</text>
  <text x="365" y="52" class="dg-sub">&#8594; capacity 4, copy + double</text>
  <rect x="470" y="30" width="240" height="34" rx="5" fill="#fef3e2" stroke="#d97706"/><text x="590" y="52" text-anchor="middle" class="dg-sub">a b c d e f g h</text>
  <text x="590" y="90" text-anchor="middle" class="dg-sub">capacity 8 &mdash; growth is amortized O(1) per Add</text>
</svg>
</div>

<h2>Collection expressions and spread (C# 12)</h2>
<div class="codeblock"><div class="codeblock-header">ModernSyntax.cs</div><pre><code>int[]  arr  = [1, 2, 3];
List&lt;int&gt; list = [1, 2, 3];
int[] merged = [..arr, 4, 5];      // spread operator .. copies then appends

// foreach with deconstruction of tuples:
var points = new List&lt;(int X, int Y)&gt; { (1, 2), (3, 4) };
foreach (var (x, y) in points)
    Console.WriteLine($"({x},{y})");</code></pre></div>

<h2>Span&lt;T&gt;: slicing without copying</h2>
<p><code>Span&lt;T&gt;</code> is a window over existing memory (array, string, stack buffer). Slicing it does <em>not</em> duplicate data &mdash; huge for parsing and performance-critical paths. You will use it directly in Week 4; recognize it now.</p>
<div class="codeblock"><div class="codeblock-header">SpanIntro.cs</div><pre><code>string csv = "10,20,30";
ReadOnlySpan&lt;char&gt; span = csv;
ReadOnlySpan&lt;char&gt; first = span[..span.IndexOf(',')];   // "10" &mdash; no new string allocated
Console.WriteLine(int.Parse(first));                     // 10</code></pre></div>

<h2>Choosing correctly: the O notation</h2>
<div class="table-wrap"><table>
<thead><tr><th>Operation</th><th>List</th><th>Dictionary</th><th>HashSet</th></tr></thead>
<tbody>
<tr><td>Find by key/index</td><td>O(1) index / O(n) search</td><td><strong>O(1)</strong></td><td>&mdash;</td></tr>
<tr><td>Contains</td><td>O(n)</td><td>O(1)</td><td><strong>O(1)</strong></td></tr>
<tr><td>Add / Remove</td><td>O(1) end / O(n) middle</td><td>O(1)</td><td>O(1)</td></tr>
</tbody></table></div>
<div class="callout warning"><div class="co-title">Common bug</div><p>Calling <code>list.Contains(x)</code> inside a loop over another list is O(n&times;m). Convert one side to a <code>HashSet</code> first &mdash; this one change routinely turns minutes into milliseconds.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Build an inventory: a <code>Dictionary&lt;string, int&gt;</code> of product &rarr; stock. Support <code>Add</code>, <code>Purchase</code> (decrement, never below zero &mdash; throw <code>InvalidOperationException</code> if empty), and <code>LowStockReport</code> (items under 5, sorted by quantity). Use collection expressions and <code>TryGetValue</code> throughout.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li><code>List</code> for sequences, <code>Dictionary</code> for lookups, <code>HashSet</code> for membership.</li>
  <li>Know the O costs; the wrong collection is the #1 avoidable perf bug.</li>
  <li>Collection expressions <code>[..]</code> are the modern literal syntax.</li>
  <li><code>Span&lt;T&gt;</code> slices memory without copying &mdash; meet it now, master it later.</li>
</ul>
`
};
