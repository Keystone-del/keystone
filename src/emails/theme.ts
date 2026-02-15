type EmailThemeProps = {
    title: string;
    previewText?: string;
    content: string;
};

export const baseEmailTheme = ({ title, previewText, content }: EmailThemeProps) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #F9FAFB;
      color: #4B5563;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 10px;
      padding: 24px;
    }

    .header {
      padding-bottom: 20px;
      border-bottom: 1px solid #E5E7EB;
    }

    .header img {
      width: 72px;
    }

    h1 {
      color: #080200;
      font-size: 24px;
      margin: 24px 0 16px;
    }

    p {
      font-size: 15px;
      line-height: 1.7;
      margin: 14px 0;
      color: #4B5563;
    }

    .highlight {
      color: #166B3B;
      font-weight: 600;
    }

    .cta {
      display: inline-block;
      background-color: #166B3B;
      color: #FFFFFF !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-top: 24px;
    }

    .footer {
      margin-top: 36px;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
    }

    .footer strong {
      color: #166B3B;
    }

    .footer a {
      color: #C9971E;
      text-decoration: none;
    }

    .footer-copy {
      margin-top: 18px;
      font-size: 11px;
      color: #9CA3AF;
    }

    @media screen and (max-width: 480px) {
      h1 {
        font-size: 20px;
      }
      p {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>

  ${previewText ? `<span style="display:none">${previewText}</span>` : ""}

  <div class="email-wrapper">
    <div class="header">
      <img src="https://res.cloudinary.com/dpmx02shl/image/upload/v1771098382/logo_v0ay2e.png" alt="Keystone National Bank Logo" />
    </div>

    ${content}

    <div class="footer">
      <p>
        <strong>Keystone National Bank</strong><br />
        Building financial confidence, together.
      </p>

      <p>
        Need help?
        <a href="mailto:support@keystonenationalbank.com.com">support@keystonenationalbank.com</a>
      </p>

      <p>
        <a href="https://play.google.com">Google Play</a> |
        <a href="https://apps.apple.com">App Store</a>
      </p>

      <p class="footer-copy">
        &copy; ${new Date().getFullYear()} Keystone National Bank.
        All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
};
