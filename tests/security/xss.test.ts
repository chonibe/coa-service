import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

describe("XSS Sanitization", () => {
  let purify: any;

  beforeAll(() => {
    const window = new JSDOM("").window;
    purify = DOMPurify(window as any);
  });

  const sanitizeOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  };

  it("should remove script tags", () => {
    const input = "<p>Hello</p><script>alert('xss')</script>";
    const output = purify.sanitize(input, sanitizeOptions);
    expect(output).toBe("<p>Hello</p>");
  });

  it("should remove event handlers", () => {
    const input = "<p onmouseover='alert(1)'>Hover me</p>";
    const output = purify.sanitize(input, sanitizeOptions);
    expect(output).toBe("<p>Hover me</p>");
  });

  it("should allow safe tags", () => {
    const input = "<h1>Title</h1><p>Paragraph with <strong>bold</strong> and <em>italics</em>.</p>";
    const output = purify.sanitize(input, sanitizeOptions);
    expect(output).toBe(input);
  });

  it("should allow safe links", () => {
    const input = "<a href='https://example.com' target='_blank'>Link</a>";
    const output = purify.sanitize(input, sanitizeOptions);
    expect(output).toContain("href=\"https://example.com\"");
    expect(output).toContain("target=\"_blank\"");
  });

  it("should remove javascript: links", () => {
    const input = "<a href='javascript:alert(1)'>Dangerous Link</a>";
    const output = purify.sanitize(input, sanitizeOptions);
    expect(output).not.toContain("href=\"javascript:alert(1)\"");
  });
});

