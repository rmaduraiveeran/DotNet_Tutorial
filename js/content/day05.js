/* Day 5: Object-Oriented Programming */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[5] = {
  html: `
<p>OOP is how C# organizes complexity: types bundle <em>data</em> with the <em>behavior</em> that owns it. Today: classes, the four pillars, and records.</p>

<h2>Classes: data + behavior in one place</h2>
<div class="codeblock"><div class="codeblock-header">BankAccount.cs</div><pre><code>public class BankAccount
{
    // auto-property with private setter &mdash; state changes only through methods
    public decimal Balance { get; private set; }
    public string Owner { get; }

    public BankAccount(string owner, decimal openingBalance)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(owner);   // guard clauses
        Owner = owner;
        Balance = openingBalance;
    }

    public void Deposit(decimal amount)
    {
        if (amount &lt;= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        Balance += amount;
    }

    public bool TryWithdraw(decimal amount)
    {
        if (amount &lt;= 0 || amount &gt; Balance) return false;
        Balance -= amount;
        return true;
    }
}</code></pre></div>
<div class="callout note"><div class="co-title">Encapsulation in one line</div><p>Fields are <code>private</code>; the outside world touches them only through properties and methods that enforce the rules. <code>Balance</code> can never go negative &mdash; not by accident, not ever.</p></div>

<h2>The four pillars, in code</h2>
<div class="table-wrap"><table>
<thead><tr><th>Pillar</th><th>One-line meaning</th><th>C# feature</th></tr></thead>
<tbody>
<tr><td>Encapsulation</td><td>Hide state, expose behavior</td><td><code>private</code> fields, properties</td></tr>
<tr><td>Abstraction</td><td>Expose <em>what</em>, hide <em>how</em></td><td>interfaces, abstract classes</td></tr>
<tr><td>Inheritance</td><td>Share implementation down a hierarchy</td><td><code>: Base</code>, <code>virtual</code>/<code>override</code></td></tr>
<tr><td>Polymorphism</td><td>One call site, many behaviors</td><td>interface dispatch, <code>override</code></td></tr>
</tbody></table></div>

<div class="codeblock"><div class="codeblock-header">Polymorphism.cs</div><pre><code>public abstract class Shape
{
    public abstract double Area();               // no body &mdash; subclasses must implement
    public virtual string Describe() =&gt; $"Shape with area {Area():F2}";  // overridable
}

public class Circle : Shape
{
    public double Radius { get; }
    public Circle(double radius) =&gt; Radius = radius;
    public override double Area() =&gt; Math.PI * Radius * Radius;
}

public class Rectangle : Shape
{
    public double Width { get; } public double Height { get; }
    public Rectangle(double w, double h) =&gt; (Width, Height) = (w, h);
    public override double Area() =&gt; Width * Height;
    public override string Describe() =&gt; $"Rectangle {Width}x{Height}, {base.Describe()}";
}

// One loop, many behaviors &mdash; polymorphism at work:
List&lt;Shape&gt; shapes = [new Circle(2), new Rectangle(3, 4)];
foreach (var s in shapes)
    Console.WriteLine(s.Describe());</code></pre></div>
<div class="diagram-wrap">
<svg viewBox="0 0 700 170" width="700" height="170" role="img" aria-label="Inheritance hierarchy">
  <rect x="270" y="20" width="160" height="42" rx="8" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.5"/><text x="350" y="40" text-anchor="middle" class="dg-text">&laquo;abstract&raquo; Shape</text><text x="350" y="56" text-anchor="middle" class="dg-sub">Area() : double</text>
  <rect x="100" y="105" width="180" height="42" rx="8" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.5"/><text x="190" y="125" text-anchor="middle" class="dg-text">Circle</text><text x="190" y="141" text-anchor="middle" class="dg-sub">Area = &pi;r&sup2;</text>
  <rect x="420" y="105" width="180" height="42" rx="8" fill="#fef3e2" stroke="#d97706" stroke-width="1.5"/><text x="510" y="125" text-anchor="middle" class="dg-text">Rectangle</text><text x="510" y="141" text-anchor="middle" class="dg-sub">Area = w&times;h</text>
  <line x1="330" y1="62" x2="200" y2="105" stroke="#8a919e" stroke-width="1.4"/>
  <line x1="370" y1="62" x2="500" y2="105" stroke="#8a919e" stroke-width="1.4"/>
</svg>
</div>

<h2>Interfaces: contracts without implementation</h2>
<div class="codeblock"><div class="codeblock-header">Interfaces.cs</div><pre><code>public interface INotificationChannel
{
    Task SendAsync(string to, string message, CancellationToken ct = default);
}

public class EmailChannel : INotificationChannel
{
    public Task SendAsync(string to, string message, CancellationToken ct = default)
        =&gt; Console.Out.WriteLineAsync($"EMAIL to {to}: {message}");
}

// Consumers depend on the interface, never the concrete class:
public class AlertService(INotificationChannel channel)   // primary constructor (C# 12)
{
    public Task Alert(string to, string msg) =&gt; channel.SendAsync(to, msg);
}</code></pre></div>

<h2>Records: immutable data made trivial</h2>
<div class="codeblock"><div class="codeblock-header">Records.cs</div><pre><code>// One line gives you: constructor, immutability, value equality,
// ToString, and a nondestructive "with" clone:
public record Money(decimal Amount, string Currency);

var price = new Money(9.99m, "USD");
var sale  = price with { Amount = 7.99m };     // copy + change one field

Console.WriteLine(price == sale);              // False &mdash; compares field values
Console.WriteLine(price == new Money(9.99m, "USD"));  // True &mdash; value equality!</code></pre></div>
<div class="callout tip"><div class="co-title">class vs record</div><p>Use <code>record</code> for data (DTOs, messages, domain events) and <code>class</code> for things with identity and behavior. If you find yourself writing only properties and equality, you wanted a record.</p></div>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (30 min)</div>
<p>Model a small library: abstract <code>LibraryItem</code> with <code>Title</code> and abstract <code>int LoanDays { get; }</code>; subclasses <code>Book</code> (21 days) and <code>Dvd</code> (7 days). Put them in a <code>List&lt;LibraryItem&gt;</code> and print a due-date report using polymorphism. Then convert the DTO you pass around into a <code>record</code> and use <code>with</code> to renew a loan.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>Encapsulate state; expose intent-bearing methods.</li>
  <li>Program against interfaces; inject implementations.</li>
  <li>Polymorphism removes type-checking if/else chains.</li>
  <li><code>record</code> = immutable data with value equality and <code>with</code> cloning.</li>
</ul>
`
};
