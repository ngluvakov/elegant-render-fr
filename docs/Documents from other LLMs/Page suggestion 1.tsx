export default function ArchivedPageSuggestion() {
  return (
    <main style={{ padding: 48, fontFamily: "Arial, sans-serif" }}>
      <h1>Archived page suggestion</h1>
      <p>
        This docs-only TSX file used to contain an older generated page draft.
        The active international implementation should use the White Rook design
        handoff, the current route map, and the copy glossary instead.
      </p>
      <ul>
        <li>Use English routes and labels.</li>
        <li>Keep IDs, slugs, and object keys frozen.</li>
        <li>Use EUR accounting and PayPal checkout wording.</li>
        <li>Do not treat this archive as production code.</li>
      </ul>
    </main>
  );
}