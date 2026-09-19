export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .privacy-page {
          min-height: 100vh;
          margin: 0;
          padding: 40px 20px;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.7;
          color: #222;
          background: #f5f7fa;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        h1 {
          color: #208aef;
          margin-bottom: 8px;
        }

        h2 {
          color: #1565c0;
          margin-top: 32px;
        }

        h3 {
          color: #333;
          margin-top: 24px;
        }

        p {
          margin: 12px 0;
        }

        ul {
          padding-left: 25px;
        }

        li {
          margin-bottom: 8px;
        }

        .updated {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .contact {
          background: #eef7ff;
          padding: 20px;
          border-left: 4px solid #208aef;
          border-radius: 6px;
          margin-top: 20px;
        }

        a {
          color: #1565c0;
        }

        footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #777;
          font-size: 14px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .privacy-page {
            padding: 0;
          }

          .container {
            margin: 0;
            padding: 24px 18px;
            border-radius: 0;
          }

          h1 {
            font-size: 28px;
          }

          h2 {
            font-size: 21px;
          }
        }
      `}</style>

      <div className="container">
        <h1>YatraBus Privacy Policy</h1>

        <p className="updated">
          Last updated: September 19, 2026
        </p>

        <p>
          YatraBus (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
          respects your privacy and is committed to protecting your personal
          information. This Privacy Policy explains how we collect, use,
          store, and protect information when you use the YatraBus mobile
          application and related services.
        </p>

        <p>
          By using YatraBus, you acknowledge the practices described in this
          Privacy Policy.
        </p>

        <h2>1. Information We Collect</h2>

        <p>
          Depending on how you use YatraBus, we may collect the following
          types of information:
        </p>

        <h3>Account Information</h3>

        <ul>
          <li>Full Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Account credentials or authentication information</li>
        </ul>

        <h3>Booking Information</h3>

        <p>
          When you make a bus booking, we may collect information necessary
          to process and manage your booking, including:
        </p>

        <ul>
          <li>Passenger name and contact information</li>
          <li>Travel date and time</li>
          <li>Bus and route information</li>
          <li>Seat information</li>
          <li>Booking or ticket details</li>
        </ul>

        <h3>Payment Information</h3>

        <p>
          If you make payments through YatraBus, payment information may be
          processed by our payment service providers. We may receive
          information necessary to confirm the payment and booking.
        </p>

        <p>
          We do not intend to store complete payment card numbers unless this
          is specifically required and securely supported by our payment
          provider.
        </p>

        <h3>Device and Technical Information</h3>

        <p>
          We may collect certain technical information about the device and
          application used to access YatraBus, such as:
        </p>

        <ul>
          <li>Device type and operating system</li>
          <li>Application version</li>
          <li>Device identifiers where permitted</li>
          <li>IP address</li>
          <li>Crash and diagnostic information</li>
          <li>Network and connectivity information</li>
        </ul>

        <h3>Push Notifications</h3>

        <p>
          YatraBus may use Firebase Cloud Messaging (FCM) to send push
          notifications. Notifications may include booking confirmations,
          ticket information, travel updates, service announcements, or other
          relevant information.
        </p>

        <h3>Location Information</h3>

        <p>
          If YatraBus requests access to your device location, we may collect
          location information only when permitted by you and where necessary
          for features that use location services.
        </p>

        <p>
          You can manage or revoke location permissions through your device
          settings.
        </p>

        <h2>2. How We Use Your Information</h2>

        <p>
          We may use collected information for the following purposes:
        </p>

        <ul>
          <li>Creating and managing user accounts</li>
          <li>Processing and managing bus bookings</li>
          <li>Issuing and displaying tickets</li>
          <li>Processing or confirming payments</li>
          <li>Sending booking and travel notifications</li>
          <li>Providing customer support</li>
          <li>Improving our application and services</li>
          <li>Detecting and preventing fraud or misuse</li>
          <li>Maintaining application security</li>
          <li>Complying with applicable legal requirements</li>
        </ul>

        <h2>3. Firebase Services</h2>

        <p>
          YatraBus uses Firebase services, including Firebase Cloud Messaging,
          to provide certain application functionality such as push
          notifications.
        </p>

        <p>
          Firebase may process technical information in accordance with its
          own privacy practices.
        </p>

        <h2>4. Information Sharing</h2>

        <p>
          We do not sell your personal information.
        </p>

        <p>
          We may share information when necessary with trusted service
          providers that help us operate YatraBus, including payment
          processors, hosting providers, notification services, analytics or
          technical service providers, and transportation or booking partners.
        </p>

        <p>
          Information may also be disclosed when required by law, legal
          process, or to protect the rights, safety, and security of users and
          our services.
        </p>

        <h2>5. Data Retention</h2>

        <p>
          We retain personal information for as long as reasonably necessary
          to provide our services, maintain booking records, comply with legal
          obligations, resolve disputes, and enforce our agreements.
        </p>

        <p>
          When information is no longer required, we may delete or anonymize
          it in accordance with our applicable data-retention practices.
        </p>

        <h2>6. Account and Data Deletion</h2>

        <p>
          You may request deletion of your YatraBus account and associated
          personal information by contacting us using the contact information
          provided below.
        </p>

        <p>
          Some information may need to be retained where required by law,
          necessary for legitimate business purposes, or required to resolve
          outstanding transactions or disputes.
        </p>

        <h2>7. Data Security</h2>

        <p>
          We take reasonable technical and organizational measures to protect
          personal information against unauthorized access, alteration,
          disclosure, or destruction.
        </p>

        <p>
          However, no method of electronic transmission or storage is
          completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>8. Children&apos;s Privacy</h2>

        <p>
          YatraBus is not intended to knowingly collect personal information
          from children without appropriate authorization. If you believe that
          a child has provided personal information to us improperly, please
          contact us so that we can review and take appropriate action.
        </p>

        <h2>9. Your Choices and Permissions</h2>

        <p>
          Depending on your device and the features you use, you may control
          certain permissions, including:
        </p>

        <ul>
          <li>Location access</li>
          <li>Push notifications</li>
          <li>Camera or other device permissions, if requested by the app</li>
        </ul>

        <p>
          You can manage these permissions through your device settings.
        </p>

        <h2>10. Third-Party Services</h2>

        <p>
          YatraBus may use third-party services to provide hosting, payment
          processing, authentication, notifications, analytics, or other
          functionality.
        </p>

        <p>
          These third parties may process information according to their own
          privacy policies and applicable terms.
        </p>

        <h2>11. Changes to This Privacy Policy</h2>

        <p>
          We may update this Privacy Policy from time to time to reflect
          changes in our services, technology, legal requirements, or privacy
          practices.
        </p>

        <p>
          When we make changes, we will update the &quot;Last updated&quot;
          date at the top of this page.
        </p>

        <h2>12. Contact Us</h2>

        <div className="contact">
          <p>
            If you have questions about this Privacy Policy, your personal
            information, or a request for data deletion, please contact us:
          </p>

          <p>
            <strong>YatraBus</strong>
            <br />
            Email:{" "}
            <a href="mailto:subhyatra15@gmail.com">
              subhyatra15@gmail.com
            </a>
          </p>
        </div>

        <footer>
          &copy; 2026 YatraBus. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
