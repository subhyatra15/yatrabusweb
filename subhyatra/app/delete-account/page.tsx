export default function DeleteAccountPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#f5f7fa",
        color: "#222",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "40px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1
          style={{
            color: "#208AEF",
            marginBottom: "8px",
          }}
        >
          YatraBus Account Deletion
        </h1>

        <p
          style={{
            color: "#666",
            fontSize: "14px",
            marginBottom: "30px",
          }}
        >
          Last updated: September 19, 2026
        </p>

        <p>
          If you would like to delete your YatraBus account and associated
          personal information, you can request account deletion by contacting
          us using the email address below.
        </p>

        <h2
          style={{
            color: "#1565c0",
            marginTop: "32px",
          }}
        >
          How to Request Account Deletion
        </h2>

        <p>
          Send an email to:
        </p>

        <p>
          <a
            href="mailto:subhyatra15@gmail.com?subject=YatraBus%20Account%20Deletion%20Request"
            style={{
              color: "#1565c0",
              fontWeight: "bold",
            }}
          >
            subhyatra15@gmail.com
          </a>
        </p>

        <p>
          Please send the request from the email address associated with your
          YatraBus account. Include your name and phone number associated with
          the account so that we can identify the account and process your
          request.
        </p>

        <h2
          style={{
            color: "#1565c0",
            marginTop: "32px",
          }}
        >
          What Data Will Be Deleted
        </h2>

        <p>
          When your account deletion request is processed, we will delete or
          anonymize personal information associated with your account where
          applicable, including:
        </p>

        <ul style={{ paddingLeft: "25px" }}>
          <li style={{ marginBottom: "8px" }}>Name</li>
          <li style={{ marginBottom: "8px" }}>Email address</li>
          <li style={{ marginBottom: "8px" }}>Phone number</li>
          <li style={{ marginBottom: "8px" }}>
            Account and authentication information
          </li>
          <li style={{ marginBottom: "8px" }}>
            Other personal information associated with the account
          </li>
        </ul>

        <h2
          style={{
            color: "#1565c0",
            marginTop: "32px",
          }}
        >
          Data That May Be Retained
        </h2>

        <p>
          Certain information may be retained when required by law, necessary
          for accounting or legal purposes, necessary to resolve disputes, or
          required to prevent fraud and maintain security.
        </p>

        <p>
          Booking or transaction records may be retained where necessary to
          comply with applicable legal or financial requirements.
        </p>

        <h2
          style={{
            color: "#1565c0",
            marginTop: "32px",
          }}
        >
          Processing Time
        </h2>

        <p>
          We will review your request and process account deletion within a
          reasonable period after verifying the request.
        </p>

        <h2
          style={{
            color: "#1565c0",
            marginTop: "32px",
          }}
        >
          Contact Us
        </h2>

        <div
          style={{
            background: "#eef7ff",
            padding: "20px",
            borderLeft: "4px solid #208AEF",
            borderRadius: "6px",
            marginTop: "20px",
          }}
        >
          <p style={{ marginTop: 0 }}>
            <strong>YatraBus</strong>
          </p>

          <p style={{ marginBottom: 0 }}>
            Email:{" "}
            <a
              href="mailto:subhyatra15@gmail.com"
              style={{ color: "#1565c0" }}
            >
              subhyatra15@gmail.com
            </a>
          </p>
        </div>

        <footer
          style={{
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid #ddd",
            color: "#777",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          &copy; 2026 YatraBus. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
