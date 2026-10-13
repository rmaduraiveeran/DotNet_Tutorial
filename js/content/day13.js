/* Day 13: Testing & xUnit */
window.DAY_CONTENT = window.DAY_CONTENT || {};
window.DAY_CONTENT[13] = {
  html: `
<p>Tests are how you change code without fear. Today: xUnit, the AAA pattern, test doubles, and what makes a test trustworthy.</p>

<h2>Setup: a test project</h2>
<div class="codeblock"><div class="codeblock-header">terminal</div><pre><code>dotnet new xunit -n TaskTracker.Tests
dotnet add TaskTracker.Tests reference TaskTracker
dotnet test</code></pre></div>

<h2>Anatomy of a good test</h2>
<div class="codeblock"><div class="codeblock-header">TaskStoreTests.cs</div><pre><code>using TaskTracker;               // the project under test

public class TaskStoreTests
{
    [Fact]                                       // a test with no inputs
    public void Add_CreatesIncrementingIds()
    {
        // Arrange
        var store = new TaskStore("memory");     // no disk &mdash; see note below

        // Act
        var first = store.Add("first", Priority.Low);
        var second = store.Add("second", Priority.High);

        // Assert &mdash; one logical assertion per test
        Assert.Equal(1, first.Id);
        Assert.Equal(2, second.Id);
    }

    [Theory]                                     // a test WITH inputs
    [InlineData(1, 1)]
    [InlineData(5, 120)]
    [InlineData(-1, 0)]
    public void Add_StoresPriority(int id, int _)
    {
        var store = new TaskStore("memory");
        var task = store.Add("x", (Priority)id);
        Assert.Equal((Priority)id, task.Priority);
    }

    [Fact]
    public void Complete_MissingId_ReturnsFalse()
    {
        var store = new TaskStore("memory");
        Assert.False(store.Complete(999));       // edge cases are where bugs live
    }
}</code></pre></div>
<div class="callout note"><div class="co-title">The AAA pattern</div><p><strong>Arrange</strong> the world, <strong>Act</strong> on one behavior, <strong>Assert</strong> the outcome. Test names read as sentences: <code>Method_Scenario_Expectation</code>. When a test fails, its name should tell you the bug without opening the file.</p></div>

<h2>Test doubles: fakes, stubs, mocks</h2>
<p>You cannot hit a real database in a unit test. You substitute the <em>interface</em> (Day 5) with a stand-in &mdash; which is only possible because your code depends on abstractions, not concrete classes.</p>
<div class="codeblock"><div class="codeblock-header">Fakes &amp; mocks with Moq</div><pre><code>public interface INotificationSender { Task SendAsync(string msg); }

public class AlertService(INotificationSender sender)      // depends on abstraction
{
    public async Task&lt;bool&gt; AlertAsync(string msg)
    {
        await sender.SendAsync(msg);
        return true;
    }
}

public class AlertServiceTests
{
    [Fact]
    public async Task AlertAsync_SendsMessage()
    {
        // Arrange &mdash; a mock that records calls:
        var mock = new Mock&lt;INotificationSender&gt;();
        var svc = new AlertService(mock.Object);

        // Act
        var ok = await svc.AlertAsync("disk full");

        // Assert &mdash; verify the interaction happened:
        Assert.True(ok);
        mock.Verify(m =&gt; m.SendAsync("disk full"), Times.Once);
    }
}</code></pre></div>
<div class="table-wrap"><table>
<thead><tr><th>Double</th><th>What it is</th><th>Use for</th></tr></thead>
<tbody>
<tr><td><strong>Stub</strong></td><td>Returns canned data</td><td>Input state you arrange</td></tr>
<tr><td><strong>Fake</strong></td><td>Working lightweight impl (in-memory repo)</td><td>Stateful dependencies</td></tr>
<tr><td><strong>Mock</strong></td><td>Records interactions</td><td>Verifying calls (out of your control)</td></tr>
</tbody></table></div>
<div class="callout tip"><div class="co-title">Mock less, fake more</div><p>Over-mocked tests assert implementation, not behavior, and break on every refactor. Prefer fakes and test through public APIs. Mock only the edges you do not own (HTTP, email, clock).</p></div>

<h2>What to test &mdash; and what never to</h2>
<div class="diagram-wrap">
<svg viewBox="0 0 820 140" width="820" height="140" role="img" aria-label="Test pyramid">
  <polygon points="410,15 560,60 260,60" fill="#e7f8f1" stroke="#0e9f6e" stroke-width="1.4"/><text x="410" y="50" text-anchor="middle" class="dg-text">Unit (70%)</text>
  <polygon points="260,70 560,70 635,110 185,110" fill="#efedfd" stroke="#6c5ce7" stroke-width="1.4"/><text x="410" y="95" text-anchor="middle" class="dg-text">Integration (20%)</text>
  <polygon points="185,118 635,118 680,138 140,138" fill="#fef3e2" stroke="#d97706" stroke-width="1.4"/><text x="410" y="133" text-anchor="middle" class="dg-text">End-to-end (10%)</text>
</svg>
</div>
<ul>
  <li><strong>Unit</strong> (fast, thousands): one class, in memory, milliseconds.</li>
  <li><strong>Integration</strong> (some): real DB in a container, real HTTP via <code>WebApplicationFactory</code>.</li>
  <li><strong>E2E</strong> (few): full system through the browser.</li>
</ul>
<p>Never unit-test: constructors and properties alone, third-party libraries, generated code. Always test: business rules, edge cases (empty, zero, negative, huge), and every bug you have ever fixed (regression test first).</p>

<h2>TDD in one loop</h2>
<p>Red: write a failing test describing the next behavior. Green: the <em>simplest</em> code that passes. Refactor: improve structure with tests as the safety net. Ten minutes of TDD per feature routinely saves hours of debugging later.</p>

<h2>Exercise</h2>
<div class="exercise"><div class="ex-title">&#9997;&#65039; Practice (30 min)</div>
<p>Back to Day 7's <code>TaskStore</code> &mdash; it still writes a real file. Extract <code>IFileSink</code> (Read/Write), make an <code>InMemorySink</code> fake, refactor the store onto it, and port the tests to the fake. Then add TDD-style: a <code>Remove(id)</code> method (red first), and a test that <code>Add</code> after <code>Remove</code> reuses the freed lowest ID.</p></div>

<h2>Key takeaways</h2>
<ul>
  <li>AAA structure and sentence names make failures self-explaining.</li>
  <li><code>[Fact]</code> for fixed cases, <code>[Theory]</code> for data-driven ones.</li>
  <li>Depend on interfaces so dependencies can be faked.</li>
  <li>The pyramid: many unit, some integration, few E2E.</li>
</ul>
`
};
