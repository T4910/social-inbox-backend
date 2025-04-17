interface InviteEmailTemplateProps {
  name: string;
  inviteUrl: string;
}

export function InviteEmailTemplate(org: InviteEmailTemplateProps) {
  return (
    <html>
      <head>
        <style>
          {`
                body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                }
                .container {
                width: 100%;
                max-width: 600px;
                margin: auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                color: #333;
                }
                a {
                color: #f97316;
                text-decoration: none;
                }
            `}
        </style>
      </head>
      <body>
        <div className="container">
          <h1>You're invited to join {org.name}!</h1>
          <p>
            You have been invited to join <b>{org.name}</b> on TaskFlow.
          </p>
          <p>
            <a href={org.inviteUrl}>Accept your invite</a>
          </p>
          <p>This link will expire in 7 days.</p>
        </div>
      </body>
    </html>
  );
}

export default InviteEmailTemplate;
