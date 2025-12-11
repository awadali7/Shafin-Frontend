"use client";

export default function WhatsAppFloatingButton() {
    const phoneNumber = "918714388741"; // +91 8714388741 without spaces and +
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    return (
        <div className="floating_btn">
            <a target="_blank" href={whatsappUrl} rel="noopener noreferrer">
                <div className="contact_icon">
                    <i className="fa fa-whatsapp my-float"></i>
                </div>
            </a>
            <p className="text_icon">Talk to us?</p>
        </div>
    );
}
