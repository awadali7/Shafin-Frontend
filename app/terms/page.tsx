import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

export default function TermsPage() {
    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[#B00000] to-red-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                        TERMS & CONDITIONS
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-100 max-w-3xl mx-auto">
                        DiagTools
                    </p>
                    <p className="text-gray-200 mt-4">
                        Last Updated: {currentDate}
                    </p>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-slate-700 leading-relaxed mb-8">
                            Welcome to DiagTools. By using our website,
                            products, software, tools, services, or online
                            training you agree to be legally bound by these
                            Terms & Conditions.
                        </p>
                        <p className="text-lg text-slate-700 leading-relaxed mb-12 font-semibold">
                            If you do not agree, please stop using the Services
                            immediately.
                        </p>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 1 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                1. ACCOUNT CREATION & RESPONSIBILITIES
                            </h2>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                                1.1 Accurate Information
                            </h3>
                            <p className="text-slate-700 mb-6">
                                Users must register with correct, complete, and
                                up-to-date information.
                            </p>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                                1.2 No Sharing of Login Credentials
                            </h3>
                            <p className="text-slate-700 mb-3">You agree to:</p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>
                                    NOT share your username or password with
                                    anyone
                                </li>
                                <li>
                                    NOT allow another person to use your account
                                </li>
                                <li>
                                    NOT sell, rent, or transfer your login
                                    details
                                </li>
                            </ul>
                            <p className="text-slate-700 mb-6">
                                All account activity is considered the
                                responsibility of the account owner.
                            </p>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                                1.3 Unauthorized Systems / Multiple Devices
                            </h3>
                            <p className="text-slate-700 mb-3">
                                Using the same username from:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-3 space-y-2 ml-4">
                                <li>Unauthorized systems</li>
                                <li>Unknown devices</li>
                                <li>VPN/proxy masking identities</li>
                                <li>
                                    Multiple simultaneous logins in suspicious
                                    patterns
                                </li>
                            </ul>
                            <p className="text-slate-700 mb-6">
                                may result in account review, suspension, or
                                termination.
                            </p>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                                1.4 Multiple Accounts Prohibited
                            </h3>
                            <p className="text-slate-700">
                                Creating multiple accounts to bypass rules,
                                limits, or restrictions is strictly prohibited.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 2 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                2. COPYRIGHT & INTELLECTUAL PROPERTY
                            </h2>
                            <p className="text-slate-700 mb-4">
                                All content on this website—including:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>Software & firmware</li>
                                <li>Diagnostic tools and activation files</li>
                                <li>Training videos & course materials</li>
                                <li>
                                    Documents, product descriptions, manuals
                                </li>
                                <li>Logos, graphics, text, branding</li>
                            </ul>
                            <p className="text-slate-700 mb-4">
                                is the exclusive property of DiagTools and
                                protected by copyright, trademark, and
                                intellectual property laws.
                            </p>
                            <p className="text-slate-700 mb-3">You may NOT:</p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>Copy or distribute materials</li>
                                <li>Share or resell online course access</li>
                                <li>
                                    Reveal, publish, or leak training content
                                </li>
                                <li>Reverse-engineer or modify software</li>
                                <li>
                                    Upload, repost, or distribute our content
                                    online
                                </li>
                            </ul>
                            <p className="text-slate-700 font-semibold">
                                Any infringement may result in account
                                termination and legal action.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 3 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                3. LICENSE & USAGE RESTRICTIONS
                            </h2>
                            <p className="text-slate-700 mb-6">
                                Purchasing our software, tools, or courses
                                grants you a non-transferable, single-user
                                license.
                            </p>
                            <p className="text-slate-700 mb-3">
                                You are NOT permitted to:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                                <li>Share software activation codes</li>
                                <li>
                                    Install software on unauthorized devices
                                </li>
                                <li>
                                    Bypass device ID or hardware ID security
                                </li>
                                <li>
                                    Use tools for illegal vehicle modification
                                    (e.g., criminal odometer tampering)
                                </li>
                                <li>
                                    Provide our tools to third parties for
                                    unauthorized commercial use
                                </li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 4 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                4. PROHIBITED ACTIVITIES
                            </h2>
                            <p className="text-slate-700 mb-3">
                                Users may NOT:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>
                                    Attempt hacking, cracking, or reverse
                                    engineering
                                </li>
                                <li>
                                    Try to bypass login limits or license
                                    verification
                                </li>
                                <li>
                                    Use the platform for illegal operations (ECM
                                    misuse, IMMO misuse, odometer crime)
                                </li>
                                <li>
                                    Upload harmful code or disrupt the website
                                </li>
                                <li>
                                    Copy, resell, or distribute digital files or
                                    firmware
                                </li>
                            </ul>
                            <p className="text-slate-700 font-semibold">
                                Violations will lead to immediate termination
                                without refund.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 5 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                5. VIOLATIONS & ACCOUNT TERMINATION
                            </h2>
                            <p className="text-slate-700 mb-6">
                                We reserve the right to suspend or permanently
                                terminate any account, without refund, if:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>A username or password is shared</li>
                                <li>
                                    User logs in from suspicious or unauthorized
                                    systems
                                </li>
                                <li>
                                    Multiple accounts are created by the same
                                    user
                                </li>
                                <li>
                                    Intellectual property is copied, leaked, or
                                    distributed
                                </li>
                                <li>
                                    Unauthorized software tampering or cracking
                                    is detected
                                </li>
                                <li>
                                    Payment fraud or chargeback abuse occurs
                                </li>
                                <li>
                                    Repeated violations of these Terms take
                                    place
                                </li>
                            </ul>
                            <p className="text-slate-700 mb-3">
                                We may also block:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                                <li>Device ID</li>
                                <li>IP address</li>
                                <li>Hardware ID</li>
                                <li>Email or phone number</li>
                            </ul>
                            <p className="text-slate-700 mt-4">
                                to prevent further misuse.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 6 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                6. PRODUCTS, SERVICES & TECHNICAL DISCLAIMER
                            </h2>
                            <p className="text-slate-700 mb-4">
                                DiagTools provides advanced automotive
                                diagnostic solutions including:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>Scanning & vehicle diagnosis</li>
                                <li>ECM repair & programming</li>
                                <li>Key & immobilizer programming</li>
                                <li>
                                    Meter calibration, repairing & programming
                                </li>
                                <li>
                                    Automatic diagnostic tools & accessories
                                </li>
                                <li>Technical training & online courses</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6">
                                6.1 Professional Knowledge Requirement
                            </h3>
                            <p className="text-slate-700 mb-6">
                                These services require automotive technical
                                knowledge. The user is responsible for ensuring
                                proper handling, correct procedures, and legal
                                compliance.
                            </p>

                            <h3 className="text-xl font-semibold text-slate-800 mb-3">
                                6.2 No Liability for Misuse
                            </h3>
                            <p className="text-slate-700 mb-3">
                                The Company is NOT responsible for:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 mb-6 space-y-2 ml-4">
                                <li>Damaged ECUs or modules</li>
                                <li>Incorrect programming decisions</li>
                                <li>Wrong procedures by technicians</li>
                                <li>
                                    Loss of data, loss of keys, or vehicle
                                    malfunction
                                </li>
                                <li>Illegal use of diagnostic tools</li>
                            </ul>
                            <p className="text-slate-700">
                                All tools must be used legally and responsibly.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 7 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                7. PAYMENTS, DELIVERY & REFUND POLICY
                            </h2>
                            <ul className="list-disc list-inside text-slate-700 space-y-3 ml-4">
                                <li>
                                    All payments must be completed before
                                    receiving access.
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-900">Delivery Timelines:</span>
                                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                                        <li>Within Kerala: 2–3 business days</li>
                                        <li>Outside Kerala: 3–10 business days (depending on the courier service)</li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="font-semibold text-slate-900">Special Requests:</span> For any special courier service requests after purchase, please contact our support team within 12 hours of purchase.
                                </li>
                                <li>
                                    Digital products, activations, and courses
                                    are non-refundable.
                                </li>
                                <li>
                                    Unauthorized sharing or misuse voids any
                                    warranties.
                                </li>
                                <li>
                                    Fraudulent chargebacks result in permanent
                                    account ban.
                                </li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 8 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                8. LIMITATION OF LIABILITY
                            </h2>
                            <p className="text-slate-700 mb-3">
                                To the maximum extent allowed by law:
                            </p>
                            <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                                <li>
                                    We are not responsible for indirect,
                                    incidental, or consequential damages
                                </li>
                                <li>
                                    We do not guarantee results from training,
                                    software, or tools
                                </li>
                                <li>
                                    Use of diagtools is strictly at the user's
                                    own risk
                                </li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 9 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                9. MODIFICATIONS TO TERMS
                            </h2>
                            <p className="text-slate-700">
                                DiagTools may update these Terms at any time.
                                Continued use of the Services after changes
                                means you accept the updated Terms.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 10 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                10. CONTACT INFORMATION
                            </h2>
                            <p className="text-slate-700 mb-6">
                                For questions or support:
                            </p>
                            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        DiagTools Support Team
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <Mail className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">
                                            diagtoosl.com
                                        </span>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Phone className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">
                                            8714388741
                                        </span>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                                        <div className="text-slate-700">
                                            Pan Square, Pezhakapilly,
                                            <br />
                                            Muvattupuzha, Ernkulam, Kerala
                                            <br />
                                            Pin: 686673
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
