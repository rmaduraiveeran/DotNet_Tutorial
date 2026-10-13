/* Day 9: Generics & Constraints */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[9] = {
  html: `
<p>Generics let you write an algorithm once and use it with any type &mdash; with zero casts and zero runtime boxing. Every collection and every DI container you have used is generic inside.</p>

<h2>The problem generics solve</h2>
<div class="codeblock"><div class="codeblock-header">Before generics (object-based, bad)</div><pre><code>// Stack of anything &mdash; but nothing is type-safe:
var stack = new OldStack();
stack.Push(42);
int n = (int)stack.Pop()!;         // cast required, can explode at runtime
stack.Push("oops");                 // compiler is fine with this!  😱</code></pre></div>
<div class="codeblock"><div class="codeblock-header">With generics (type-safe, fast)</div><pre><code>var stack = new Stack&lt;int&gt;();
stack.Push(42);
int n = stack.Pop();               // no cast, no boxing, compile-time checked
// stack.Push("oops");             // compiler error &mdash; caught before running</code></pre></div>

<h2>Writing your own generic type</h2>
<div class="codeblock"><div class="codeblock-header">Result&lt;T&gt; &mdash; a production-grade pattern</div><pre><code>public class Result&lt;T&gt;
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess =&gt; Error is null;

    private Result(T value) { Value = value; }
    private Result(string error) { Error = error; }

    public static Result&lt;T&gt; Ok(T value) =&gt; new(value);
    public static Result&lt;T&gt; Fail(string error) =&gt; new(error);
}

// Usage &mdash; same class, two types, no duplication:
Result&lt;int&gt; parsed = int.TryParse(raw, out var n) ? Result&lt;int&gt;.Ok(n) : Result&lt;int&gt;.Fail("bad input");
Result&lt;string&gt; found = Result&lt;string&gt;.Fail("not found");</code></pre></div>

<h2>Constraints: asking for capabilities</h2>
<p>A constraint tells the compiler what <code>T</code> can do, which unlocks members and better error messages.</p>
<div class="codeblock"><div class="codeblock-header">Constraints.cs</div><pre><code>// T must be a reference type
public class Repository&lt;T&gt; where T : class { /* ... */ }

// T must be comparable &mdash; allows calling CompareTo
public static T Max&lt;T&gt;(T a, T b) where T : IComparable&lt;T&gt; =&gt;
    a.CompareTo(b) &gt;= 0 ? a : b;

// T must have a parameterless constructor &mdash; allows new()
public static T Create&lt;T&gt;() where T : new() =&gt; new T();

// T must implement an interface &mdash; allows calling its members
public static string Describe&lt;T&gt;(T item) where T : INamed =&gt; item.Name;

public interface INamed { string Name { get; } }</code></pre></div>
<div class="table-wrap"><table>
<thead><tr><th>Constraint</th><th>Guarantees</th></tr></thead>
<tbody>
<tr><td><code>where T : class</code></td><td>reference type</td></tr>
<tr><td><code>where T : struct</code></td><td>value type (non-nullable)</td></tr>
<tr><td><code>where T : SomeBase</code></td><td>inherits that base class</td></tr>
<tr><td><code>where T : IFace</code></td><td>implements the interface</td></tr>
<tr><td><code>where T : new()</code></td><td>has a public parameterless ctor</td></tr>
<tr><td><code>where T : notnull</code></td><td>cannot be null</td></tr>
</tbody></table></div>

<h2>Generic methods and inference</h2>
<div class="codeblock"><div class="codeblock-header">Inference.cs</div><pre><code>static T? FirstOrNull&lt;T&gt;(IEnumerable&lt;T&gt; source, Func&lt;T, bool&gt; predicate)
{
    foreach (var item in source)
        if (predicate(item)) return item;
    return default;
}

// The compiler infers T &mdash; you almost never write it explicitly:
var firstEven = FirstOrNull(new[] { 1, 3, 5, 6 }, n =&gt; n % 2 == 0);   // 6
// firstEven is int? here &mdash; default for int? is null when T is a reference type</code></pre></div>
<div class="callout tip"><div class="co-title">Variance in one line each</div><p><code>out T</code> (covariance): <code>IEnumerable&lt;Cat&gt;</code> can be used as <code>IEnumerable&lt;Animal&gt;</code> &mdash; safe for outputs. <code>in T</code> (contravariance): <code>Action&lt;Animal&gt;</code> can be used as <code>Action&lt;Cat&gt;</code> &mdash; safe for inputs. Only interfaces and delegates support variance.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (25 min)</div>
<p>Implement a generic <code>Cache&lt;TKey, TValue&gt;</code> backed by <code>Dictionary</code> with <code>GetOrAdd(key, factory)</code> (factory = <code>Func&lt;TKey,TValue&gt;</code>), an expiry via <code>TimeSpan</code>, and a <code>PurgeExpired()</code>. Constrain nothing &mdash; then add a version <code>EntityCache&lt;T&gt;</code> where <code>T : IEntity</code> that also indexes by <code>Id</code>.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Generics = reuse without casts, boxing, or runtime surprises.</li>
  <li>Constraints buy capabilities for <code>T</code> at compile time.</li>
  <li><code>Func</code>/<code>Action</code> parameters make generic code flexible.</li>
  <li>Variance (<code>in</code>/<code>out</code>) explains most "why won't this assign" moments.</li>
</ul>
<h2>Challenge mode &#127942;</h2><ul><li>Write <code>static T MaxBy&lt;T&gt;(this IEnumerable&lt;T&gt;, Func&lt;T,object&gt; key)</code> as an extension method.</li><li>Add covariance: <code>out T</code> on a custom <code>IRepository&lt;out T&gt;</code> and show assignment to the base type.</li><li>Implement <code>Result&lt;T&gt;.Map&lt;U&gt;(Func&lt;T,U&gt;)</code> that chains only on success &mdash; a railway-oriented start.</li></ul>
`,
  quiz: [
    {
      "q": "Generics replace object-based collections primarily to…",
      "a": [
        "Save memory",
        "Get compile-time type safety without casts/boxing",
        "Run faster loops",
        "Support dynamic"
      ],
      "correct": 1,
      "expl": "Type errors move to compile time; no runtime casts."
    },
    {
      "q": "where T : IComparable<T> unlocks…",
      "a": [
        "new T()",
        "Calling CompareTo on T",
        " boxing",
        "Reflection"
      ],
      "correct": 1,
      "expl": "Constraints expose interface members to the compiler."
    },
    {
      "q": "IEnumerable<Cat> → IEnumerable<Animal> works because of…",
      "a": [
        "Contravariance (in)",
        "Covariance (out)",
        "Casting",
        "Generics inheritance"
      ],
      "correct": 1,
      "expl": "out T is covariant: safe when T only appears in output positions."
    },
    {
      "q": "Cache.GetOrAdd(key, factory) — the factory parameter type is…",
      "a": [
        "Action<TKey>",
        "Func<TKey,TValue>",
        "Predicate<TKey>",
        "Converter"
      ],
      "correct": 1,
      "expl": "It produces a TValue from a TKey — a Func."
    }
  ]

};