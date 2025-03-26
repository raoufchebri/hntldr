import React from 'react';

export default function Disclaimer() {
  return (
    <div className="pixel-borders p-3 bg-muted text-primary text-xs font-pixel">
      <p className="mb-1">
        <strong className="font-pixel-bold">DISCLAIMER:</strong> HNTLDR is an <strong className="font-pixel-bold">unofficial</strong> project and is <strong className="font-pixel-bold">not affiliated</strong> with Hacker News, Y Combinator, or any of their properties.
      </p>
      <p>
        This is a fan-made project that summarizes content from Hacker News. &ldquo;Hacker News&rdquo; is a trademark of Y Combinator, which we use under nominative fair use solely to identify the source of the content we summarize.
      </p>
    </div>
  );
} 