export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildTransactionalEmail(params: {
  platformName: string;
  previewText: string;
  heading: string;
  bodyHtml: string;
  footerNote?: string;
}): { html: string; text: string } {
  const platform = escapeHtml(params.platformName);
  const heading = escapeHtml(params.heading);
  const preview = escapeHtml(params.previewText);
  const footer = params.footerNote
    ? `<p style="margin:24px 0 0;font-size:13px;color:#64748b;">${escapeHtml(params.footerNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#1e3a8a;letter-spacing:0.04em;text-transform:uppercase;">${platform}</p>
              <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;color:#0f172a;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;color:#334155;">
              ${params.bodyHtml}
              ${footer}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} ${platform}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    params.platformName,
    params.heading,
    "",
    params.previewText,
    params.footerNote ? `\n${params.footerNote}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}
