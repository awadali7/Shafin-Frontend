"use client";

export default function WhatsAppFloatingButton() {
    const phoneNumber = "918714388741"; // +91 8714388741 without spaces and +
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="group fixed bottom-6 right-6 z-1000 flex h-14 items-center gap-2 overflow-hidden rounded-full bg-whatsapp pl-3.5 pr-3.5 text-white shadow-[0_8px_24px_rgba(37,211,102,0.4)] transition-[width,box-shadow] duration-300 ease-out hover:shadow-[0_12px_32px_rgba(37,211,102,0.5)] sm:w-14 sm:hover:w-[170px]"
        >
            <svg
                className="h-7 w-7 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
            >
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.43 1.32 4.93L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.13-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.32a8.15 8.15 0 0 1-1.26-4.37c0-4.55 3.7-8.22 8.27-8.22zm-4.42 4.7c-.18 0-.46.06-.7.32-.24.26-.92.9-.92 2.18 0 1.29.94 2.53 1.07 2.7.13.18 1.83 2.8 4.45 3.92.62.27 1.1.43 1.48.55.62.2 1.19.17 1.63.1.5-.07 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.07-.1-.24-.16-.5-.29-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.09-.4-2.08-1.28-.77-.68-1.29-1.53-1.44-1.79-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.46-.07-.13-.59-1.45-.82-1.98-.21-.5-.43-.44-.59-.45h-.5z" />
            </svg>
            <span className="hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:inline-block sm:delay-100">
                Chat with us
            </span>
        </a>
    );
}
